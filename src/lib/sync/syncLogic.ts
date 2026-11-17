/**
 * What to do when this computer and the school's server compare notes, as
 * a pure decision (docs/adr/0015-sync-through-cloudflare.md). The rule above
 * all others: nothing is ever overwritten without the teacher choosing, except
 * a computer that has nothing of its own yet.
 */

import { STORAGE_PREFIX } from "$lib/backup/backup";

/** What this computer remembers about its last sync, per signed-in e-mail. */
export interface SyncMeta {
  email: string;
  /** The server revision this computer's classes last matched. */
  revision: number;
  /** Fingerprint of the classes as they were then. */
  hash: string | null;
  /** ISO time of the last successful save or download. */
  syncedAt: string | null;
  /**
   * A short hash of each entry as it was then, so a later merge can tell
   * which side changed what (`mergeThreeWay`).
   */
  keys?: Record<string, string>;
}

export type AskReason =
  /** Classes here, other classes on the server, never synced from here. */
  | "first-sync"
  /** Both changed since the last sync. */
  | "both-changed"
  /** Last synced by another teacher on this computer. */
  | "other-teacher";

export type Decision =
  | { kind: "none" }
  /** Nothing to move, but remember where things stand. */
  | { kind: "adopt" }
  | { kind: "pull" }
  | { kind: "push"; base: number }
  | { kind: "ask"; reason: AskReason };

export interface DecideInput {
  email: string;
  meta: SyncMeta | null;
  /** The server's revision; 0 when it has nothing for this teacher. */
  remote: number;
  localHash: string;
  /** This computer has nothing of its own yet (`isPristine`). */
  pristine: boolean;
}

export function decide({
  email,
  meta,
  remote,
  localHash,
  pristine,
}: DecideInput): Decision {
  if (!meta || meta.email !== email) {
    const otherTeacher = meta !== null;
    if (remote === 0) {
      if (pristine) return { kind: "adopt" };
      // Classes made before sync was turned on: this teacher's own. But a
      // computer last synced by someone else must ask first.
      return otherTeacher
        ? { kind: "ask", reason: "other-teacher" }
        : { kind: "push", base: 0 };
    }
    if (pristine) return { kind: "pull" };
    return {
      kind: "ask",
      reason: otherTeacher ? "other-teacher" : "first-sync",
    };
  }

  const changedHere = localHash !== meta.hash;
  if (remote === meta.revision) {
    return changedHere ? { kind: "push", base: remote } : { kind: "none" };
  }
  if (remote > meta.revision) {
    return changedHere
      ? { kind: "ask", reason: "both-changed" }
      : { kind: "pull" };
  }
  // The server is behind what this computer last saw (its data was reset):
  // put this computer's classes back, unless there is nothing to put.
  return pristine ? { kind: "adopt" } : { kind: "push", base: remote };
}

/**
 * Whether this computer has nothing of its own yet: one unnamed Class, and
 * nothing it has earned, spotted, written or recorded. Its settings and an
 * idle Timer don't count.
 */
export function isPristine(data: Record<string, string>): boolean {
  try {
    const list = JSON.parse(data[`${STORAGE_PREFIX}classes`] ?? "null");
    if (list) {
      const classes = Array.isArray(list.classes) ? list.classes : [];
      if (classes.length > 1) return false;
      if (classes.length === 1 && classes[0]?.name) return false;
    }
  } catch {
    return false;
  }
  const classPrefix = `${STORAGE_PREFIX}class:`;
  return Object.keys(data).every((key) => {
    if (!key.startsWith(classPrefix)) return true;
    const part = key.slice(key.indexOf(":", classPrefix.length) + 1);
    return part === "settings" || part === "timer";
  });
}

/** The backup's entries in a fixed order, for fingerprinting. */
export function canonical(data: Record<string, string>): string {
  return JSON.stringify(
    Object.keys(data)
      .sort()
      .map((key) => [key, data[key]]),
  );
}

/** A short, fast, non-cryptographic hash (cyrb53), for telling entries apart. */
export function shortHash(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export function keyHashes(
  data: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, shortHash(value)]),
  );
}

/**
 * Entries that change all the time without the teacher doing anything worth
 * a question — statistics, the arrival counter, the Timer, a Class's settings
 * and Scene, which menus have been seen, the language — so both computers
 * changing one is settled without asking: statistics are combined, the rest
 * keeps this computer's.
 */
function isRoutine(key: string): boolean {
  return (
    /:(stats|arrived|timer|settings|[a-z]+:legends)$/.test(key) ||
    key === `${STORAGE_PREFIX}seen-scenes` ||
    key === `${STORAGE_PREFIX}language` ||
    key === `${STORAGE_PREFIX}settings`
  );
}

/**
 * Two computers' statistics for the same Class, combined: for each day and
 * each figure the larger, so time recorded on either side is kept and
 * nothing is counted twice. (Two computers running the same Class on the
 * same day between syncs would undercount, which is the safe side.)
 */
export function mergeStats(local: string, remote: string): string {
  try {
    const a = JSON.parse(local);
    const b = JSON.parse(remote);
    const days: Record<string, Record<string, unknown>> = { ...(b.days ?? {}) };
    for (const [day, mine] of Object.entries(
      (a.days ?? {}) as Record<string, Record<string, unknown>>,
    )) {
      const theirs = days[day];
      if (!theirs) {
        days[day] = mine;
        continue;
      }
      const merged: Record<string, unknown> = { ...theirs };
      for (const [field, value] of Object.entries(mine)) {
        if (field === "level") continue;
        if (typeof value === "number") {
          merged[field] = Math.max(value, Number(theirs[field] ?? 0));
        }
      }
      const levels: Record<string, [number, number]> = {
        ...((theirs.level ?? {}) as Record<string, [number, number]>),
      };
      for (const [slot, pair] of Object.entries(
        (mine.level ?? {}) as Record<string, [number, number]>,
      )) {
        const other = levels[slot];
        if (!other || pair[1] > other[1]) levels[slot] = pair;
      }
      merged.level = levels;
      days[day] = merged;
    }
    return JSON.stringify({ version: 1, days });
  } catch {
    return local;
  }
}

/** The same Classes, with the same names, whichever is on screen. */
function sameClasses(local: string, remote: string): boolean {
  try {
    return (
      JSON.stringify(JSON.parse(local).classes) ===
      JSON.stringify(JSON.parse(remote).classes)
    );
  } catch {
    return false;
  }
}

export type MergeResult =
  | { ok: true; data: Record<string, string> }
  | { ok: false; conflicts: string[] };

/**
 * Combine this computer's entries and the server's, given what both were at
 * the last sync (`base`, as `keyHashes`). An entry only one side changed is
 * taken from that side; one both changed is settled automatically if it is
 * routine (`isRoutine`), and otherwise is a conflict the teacher must settle.
 */
export function mergeThreeWay(
  base: Record<string, string>,
  local: Record<string, string>,
  remote: Record<string, string>,
): MergeResult {
  const changed = (side: Record<string, string>, key: string) =>
    (key in side ? shortHash(side[key]) : undefined) !== base[key];
  const keys = new Set([
    ...Object.keys(base),
    ...Object.keys(local),
    ...Object.keys(remote),
  ]);
  const data: Record<string, string> = {};
  const conflicts: string[] = [];
  for (const key of keys) {
    const here = changed(local, key);
    const there = changed(remote, key);
    let value: string | undefined;
    if (!here) value = remote[key];
    else if (!there) value = local[key];
    else if (local[key] === remote[key]) value = local[key];
    else if (
      key === `${STORAGE_PREFIX}classes` &&
      sameClasses(local[key], remote[key])
    ) {
      // Only which Class is on screen differs: this computer's own choice.
      value = local[key];
    } else if (isRoutine(key)) {
      value =
        key.endsWith(":stats") && key in local && key in remote
          ? mergeStats(local[key], remote[key])
          : (local[key] ?? remote[key]);
    } else {
      conflicts.push(key);
      continue;
    }
    if (value !== undefined) data[key] = value;
  }
  return conflicts.length > 0 ? { ok: false, conflicts } : { ok: true, data };
}
