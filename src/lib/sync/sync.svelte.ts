/**
 * Keeping this computer's classes in step with the teacher's record on the
 * school's server, when the copy has sync turned on
 * (docs/adr/0015-sync-through-cloudflare.md).
 *
 * Off by default, and off whenever the API isn't there (the plain static
 * build, `vite dev`): the app then works exactly as before. Errors never
 * count as data: only a JSON answer from the API leads to a download, an
 * upload or a question.
 */

import { browser } from "$app/environment";
import {
  createBackup,
  parseBackup,
  restoreBackup,
  storageEntries,
  type Backup,
} from "$lib/backup/backup";
import { stats } from "$lib/stats/stats.svelte";
import {
  BASE_REVISION_HEADER,
  MAX_SYNC_BYTES,
  REVISION_HEADER,
  UPDATED_AT_HEADER,
  WRITE_HEADER,
} from "./protocol";
import {
  canonical,
  decide,
  isPristine,
  keyHashes,
  mergeThreeWay,
  type AskReason,
  type SyncMeta,
} from "./syncLogic";

/** Outside the app's prefix, so neither a backup nor an import touches it. */
const META_KEY = "shy-safari-sync";
const CHECK_MS = 60_000;
const RETRY_MS = 120_000;

export type SyncStatus =
  /** No sync on this copy. */
  | "off"
  | "starting"
  | "synced"
  | "saving"
  /** The server can't be reached right now; tries again later. */
  | "offline"
  /** The Access session ran out: a reload signs the teacher in again. */
  | "signed-out"
  | "too-large"
  | "conflict";

export interface Conflict {
  reason: AskReason;
  remote: number;
}

type Answer<T> =
  | { kind: "ok"; value: T }
  | { kind: "off" }
  | { kind: "retry"; signedOut?: boolean };

async function call(
  path: string,
  init: RequestInit = {},
): Promise<Answer<Response>> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      cache: "no-store",
      // An expired Access session answers with a redirect to its sign-in
      // page: seen here as an opaque redirect, never followed.
      redirect: "manual",
    });
  } catch {
    return { kind: "retry" };
  }
  if (response.type === "opaqueredirect" || response.status === 401) {
    return { kind: "retry", signedOut: true };
  }
  if (response.status === 503) return { kind: "off" };
  return { kind: "ok", value: response };
}

function isJson(response: Response) {
  return (response.headers.get("Content-Type") ?? "").includes(
    "application/json",
  );
}

async function gzip(text: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  if (typeof CompressionStream === "undefined") return bytes;
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const compressed = bytes[0] === 0x1f && bytes[1] === 0x8b;
  if (!compressed) return new TextDecoder().decode(bytes);
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

async function fingerprint(data: Record<string, string>): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical(data)),
  );
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

function readMeta(): SyncMeta | null {
  try {
    const meta = JSON.parse(localStorage.getItem(META_KEY) ?? "null");
    return meta && typeof meta.email === "string" ? meta : null;
  } catch {
    return null;
  }
}

function writeMeta(meta: SyncMeta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // Without storage there is nothing to keep in step anyway.
  }
}

function snapshot(): Backup {
  stats.flush();
  return createBackup(storageEntries(localStorage));
}

class Sync {
  status = $state<SyncStatus>("off");
  email = $state<string | null>(null);
  syncedAt = $state<string | null>(null);
  conflict = $state<Conflict | null>(null);

  #timer: ReturnType<typeof setInterval> | null = null;
  #busy = false;

  /** Whether this copy syncs at all, for wording that depends on it. */
  get enabled() {
    return this.status !== "off";
  }

  /** Called once the app has restored the Class on screen. */
  async start() {
    if (!browser || this.#timer) return;
    this.status = "starting";
    const me = await call("/api/me");
    if (me.kind === "off") {
      this.status = "off";
      return;
    }
    if (me.kind === "retry") {
      this.status = me.signedOut ? "signed-out" : "offline";
      setTimeout(() => {
        this.#timer = null;
        if (this.status !== "off") void this.start();
      }, RETRY_MS);
      return;
    }
    const response = me.value;
    const body = isJson(response)
      ? await response.json().catch(() => null)
      : null;
    if (!response.ok || typeof body?.email !== "string") {
      // A missing route answers with the site's 404 page: no sync here.
      this.status = "off";
      return;
    }
    this.email = body.email;
    this.syncedAt =
      readMeta()?.email === body.email ? readMeta()!.syncedAt : null;
    this.#timer = setInterval(() => void this.check(), CHECK_MS);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) void this.check();
    });
    await this.check();
  }

  /** Compare with the server and act on it. */
  async check() {
    if (!this.email || this.#busy || this.conflict) return;
    if (this.status === "too-large") return;
    this.#busy = true;
    try {
      const answer = await call("/api/revision");
      if (answer.kind !== "ok") return this.#unreachable(answer);
      const response = answer.value;
      const body = isJson(response)
        ? await response.json().catch(() => null)
        : null;
      if (!response.ok || typeof body?.revision !== "number") {
        this.status = "offline";
        return;
      }
      const remote = body.revision as number;
      const local = snapshot();
      const localHash = await fingerprint(local.data);
      const meta = readMeta();
      const decision = decide({
        email: this.email,
        meta,
        remote,
        localHash,
        pristine: isPristine(local.data),
      });
      switch (decision.kind) {
        case "none":
          this.status = "synced";
          return;
        case "adopt":
          writeMeta({
            email: this.email,
            revision: remote,
            hash: localHash,
            syncedAt: meta?.email === this.email ? meta.syncedAt : null,
            keys: keyHashes(local.data),
          });
          this.status = "synced";
          return;
        case "pull":
          await this.#pull();
          return;
        case "push":
          await this.#push(decision.base, local, localHash);
          return;
        case "ask":
          await this.#reconcile(decision.reason, remote, local, localHash);
          return;
      }
    } finally {
      this.#busy = false;
    }
  }

  /** Save now, if anything changed. */
  saveNow() {
    return this.check();
  }

  /** The teacher's answer to a conflict. */
  async resolve(choice: "server" | "local") {
    const conflict = this.conflict;
    if (!conflict || !this.email) return;
    this.conflict = null;
    this.#busy = true;
    try {
      if (choice === "server") {
        if (conflict.remote === 0) {
          // Nothing on the server for this teacher: start empty here.
          stats.freeze();
          restoreBackup(localStorage, createBackup([]));
          writeMeta({
            email: this.email,
            revision: 0,
            hash: null,
            syncedAt: null,
          });
          location.reload();
          return;
        }
        await this.#pull();
      } else {
        const local = snapshot();
        await this.#push(conflict.remote, local, await fingerprint(local.data));
      }
    } finally {
      this.#busy = false;
    }
  }

  #unreachable(
    answer: { kind: "off" } | { kind: "retry"; signedOut?: boolean },
  ) {
    this.status =
      answer.kind === "retry" && answer.signedOut ? "signed-out" : "offline";
  }

  /** The teacher's record, checked, or null (status set) if unusable. */
  async #download(): Promise<{
    revision: number;
    updatedAt: string | null;
    backup: Backup;
  } | null> {
    const answer = await call("/api/backup");
    if (answer.kind !== "ok") {
      this.#unreachable(answer);
      return null;
    }
    const response = answer.value;
    if (response.status !== 200) {
      this.status = "offline";
      return null;
    }
    const revision = Number(response.headers.get(REVISION_HEADER));
    const bytes = new Uint8Array(await response.arrayBuffer());
    const parsed = parseBackup(await gunzip(bytes).catch(() => ""));
    if (!parsed.ok || !Number.isInteger(revision) || revision < 1) {
      // Never replace classes with something unreadable.
      this.status = "offline";
      return null;
    }
    return {
      revision,
      updatedAt: response.headers.get(UPDATED_AT_HEADER),
      backup: parsed.backup,
    };
  }

  /**
   * Before asking, try not to. If the server already holds exactly these
   * classes (a save whose answer was lost when the tab closed, say), there
   * is nothing to choose. If both sides changed different things since the
   * last sync, they are merged (`mergeThreeWay`). Only what is left is the
   * teacher's to settle.
   */
  async #reconcile(
    reason: AskReason,
    remote: number,
    local: Backup,
    localHash: string,
    retries = 1,
  ) {
    if (remote > 0) {
      const record = await this.#download();
      if (!record) return;
      const remoteHash = await fingerprint(record.backup.data);
      if (remoteHash === localHash) {
        this.#remember(
          record.revision,
          localHash,
          local.data,
          record.updatedAt,
        );
        this.status = "synced";
        return;
      }
      const meta = readMeta();
      if (
        reason === "both-changed" &&
        meta?.email === this.email &&
        meta.keys
      ) {
        const merged = mergeThreeWay(meta.keys, local.data, record.backup.data);
        if (merged.ok) {
          const mergedBackup: Backup = { ...local, data: merged.data };
          const mergedHash = await fingerprint(merged.data);
          if (mergedHash === remoteHash) {
            // The server already has everything: just take it.
            await this.#apply(record.revision, record.backup, record.updatedAt);
            return;
          }
          const saved = await this.#push(
            record.revision,
            mergedBackup,
            mergedHash,
            retries,
          );
          if (saved && mergedHash !== localHash) {
            await this.#apply(saved.revision, mergedBackup, saved.updatedAt);
          }
          return;
        }
      }
    }
    this.conflict = { reason, remote };
    this.status = "conflict";
  }

  #remember(
    revision: number,
    hash: string,
    data: Record<string, string>,
    syncedAt: string | null,
  ) {
    writeMeta({
      email: this.email!,
      revision,
      hash,
      syncedAt,
      keys: keyHashes(data),
    });
    this.syncedAt = syncedAt;
  }

  /** Replace this computer's classes with `backup`, and start again. */
  async #apply(revision: number, backup: Backup, syncedAt: string | null) {
    stats.freeze();
    restoreBackup(localStorage, backup);
    this.#remember(
      revision,
      await fingerprint(backup.data),
      backup.data,
      syncedAt,
    );
    // Every store read its Class at start-up: begin again from the new data.
    location.reload();
  }

  async #pull() {
    const record = await this.#download();
    if (!record) return;
    await this.#apply(record.revision, record.backup, record.updatedAt);
  }

  /** Save; returns what was saved, or null (status set) if it wasn't. */
  async #push(
    base: number,
    local: Backup,
    localHash: string,
    retries = 1,
  ): Promise<{ revision: number; updatedAt: string | null } | null> {
    const body = await gzip(JSON.stringify(local));
    if (body.length > MAX_SYNC_BYTES) {
      this.status = "too-large";
      return null;
    }
    this.status = "saving";
    const answer = await call("/api/backup", {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        [WRITE_HEADER]: "1",
        [BASE_REVISION_HEADER]: String(base),
      },
      body: body as Uint8Array<ArrayBuffer>,
    });
    if (answer.kind !== "ok") {
      this.#unreachable(answer);
      return null;
    }
    const response = answer.value;
    const result = isJson(response)
      ? await response.json().catch(() => null)
      : null;
    if (response.status === 409 && typeof result?.revision === "number") {
      // Someone saved in between: settle it once more, then ask.
      if (retries > 0) {
        await this.#reconcile(
          "both-changed",
          result.revision,
          local,
          localHash,
          retries - 1,
        );
      } else {
        this.conflict = { reason: "both-changed", remote: result.revision };
        this.status = "conflict";
      }
      return null;
    }
    if (response.status === 413) {
      this.status = "too-large";
      return null;
    }
    if (!response.ok || typeof result?.revision !== "number") {
      this.status = "offline";
      return null;
    }
    const updatedAt = result.updatedAt ?? new Date().toISOString();
    this.#remember(result.revision, localHash, local.data, updatedAt);
    this.status = "synced";
    return { revision: result.revision, updatedAt };
  }
}

export const sync = new Sync();
