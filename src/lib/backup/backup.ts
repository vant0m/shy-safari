/**
 * Moving everything a teacher has saved to another computer, browser or
 * address, as one file (docs/adr/0011-backup-export-import.md).
 *
 * Everything the app keeps lives in localStorage under one prefix, so a
 * backup is simply those keys and their raw values. Kept free of the DOM and
 * of state so it is easy to test: the caller passes in the entries and a
 * storage to write to.
 *
 * What is left out: the microphone choice and its calibration. They describe
 * the computer the file was made on, not the classes, and would be wrong (or
 * meaningless) on another one. Importing keeps this computer's own.
 */

export const STORAGE_PREFIX = "class-noise-level:";
export const BACKUP_APP = "shy-safari";
export const BACKUP_VERSION = 1;

/** The record holding the room's settings, microphone and all. */
const ROOM_SETTINGS_KEY = `${STORAGE_PREFIX}settings`;
const MACHINE_FIELDS = ["deviceId", "calibration"] as const;

/** Big enough for years of classes, small enough to refuse a stray video. */
export const MAX_BACKUP_BYTES = 5_000_000;

export interface Backup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  /** Raw localStorage values, keyed by their full key. */
  data: Record<string, string>;
}

/** Just enough of the Storage interface for writing a backup back. */
export interface StorageLike {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type ParseResult =
  | { ok: true; backup: Backup }
  | { ok: false; reason: "notJson" | "notBackup" | "newerVersion" | "empty" };

function withoutMachineFields(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return raw;
    for (const field of MACHINE_FIELDS) delete parsed[field];
    return JSON.stringify(parsed);
  } catch {
    return raw;
  }
}

/** Every saved entry of this app, ready to be written to a file. */
export function createBackup(
  entries: Iterable<[string, string]>,
  now: Date = new Date(),
): Backup {
  const data: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (!key.startsWith(STORAGE_PREFIX)) continue;
    data[key] = key === ROOM_SETTINGS_KEY ? withoutMachineFields(value) : value;
  }
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    data,
  };
}

/** The entries of a Storage, for `createBackup`. */
export function storageEntries(storage: StorageLike): [string, string][] {
  const entries: [string, string][] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key === null) continue;
    const value = storage.getItem(key);
    if (value !== null) entries.push([key, value]);
  }
  return entries;
}

/** A file name with the date in it, so several backups sort in order. */
export function backupFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `shy-safari-${day}.json`;
}

/** Read a file's text back into a backup, or say why it can't be one. */
export function parseBackup(text: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "notJson" };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, reason: "notBackup" };
  }
  const { app, version, exportedAt, data } = parsed as Partial<Backup>;
  if (app !== BACKUP_APP || typeof version !== "number") {
    return { ok: false, reason: "notBackup" };
  }
  if (version > BACKUP_VERSION) return { ok: false, reason: "newerVersion" };
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, reason: "notBackup" };
  }
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    // Only this app's keys, and only text, whatever the file claims.
    if (key.startsWith(STORAGE_PREFIX) && typeof value === "string") {
      clean[key] = value;
    }
  }
  if (!(`${STORAGE_PREFIX}classes` in clean)) {
    return { ok: false, reason: "empty" };
  }
  return {
    ok: true,
    backup: {
      app: BACKUP_APP,
      version,
      exportedAt: typeof exportedAt === "string" ? exportedAt : "",
      data: clean,
    },
  };
}

/**
 * Replace everything this app has saved with the backup's contents. Merging
 * is not offered: two computers' Classes have unrelated ids, and a half-merged
 * Collection would be worse than either. This computer's microphone and
 * calibration are kept.
 */
export function restoreBackup(storage: StorageLike, backup: Backup) {
  let machine: Record<string, unknown> = {};
  try {
    const room = JSON.parse(storage.getItem(ROOM_SETTINGS_KEY) ?? "null");
    if (room && typeof room === "object") {
      for (const field of MACHINE_FIELDS) {
        if (field in room) machine[field] = room[field];
      }
    }
  } catch {
    machine = {};
  }

  const doomed = storageEntries(storage)
    .map(([key]) => key)
    .filter((key) => key.startsWith(STORAGE_PREFIX));
  for (const key of doomed) storage.removeItem(key);

  for (const [key, value] of Object.entries(backup.data)) {
    if (key === ROOM_SETTINGS_KEY && Object.keys(machine).length > 0) {
      let room: Record<string, unknown> = {};
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object") room = parsed;
      } catch {
        room = {};
      }
      storage.setItem(key, JSON.stringify({ ...room, ...machine }));
    } else {
      storage.setItem(key, value);
    }
  }
  if (!(ROOM_SETTINGS_KEY in backup.data) && Object.keys(machine).length > 0) {
    storage.setItem(ROOM_SETTINGS_KEY, JSON.stringify(machine));
  }
}
