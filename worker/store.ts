/**
 * Where each teacher's record lives: one row per e-mail pointing at the
 * current write, and the record itself in pieces (D1 caps one statement at
 * 100 KB). A save writes its pieces under a fresh id and moves the pointer
 * in the same transaction, only if the revision is still the one it built
 * on, so two saves racing can never mix their pieces.
 */

import { CHUNK_BYTES } from "../src/lib/sync/protocol";
import type { D1Database } from "./env";

export interface StoredRecord {
  revision: number;
  updatedAt: string;
  data: Uint8Array<ArrayBuffer>;
}

export type SaveResult =
  | { ok: true; revision: number; updatedAt: string }
  | { ok: false; revision: number };

export interface BackupStore {
  get(email: string): Promise<StoredRecord | null>;
  revision(email: string): Promise<number>;
  /** Saves only if the record is still at `base` (0: no record yet). */
  save(email: string, base: number, data: Uint8Array): Promise<SaveResult>;
}

function toBytes(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (Array.isArray(value)) return Uint8Array.from(value as number[]);
  throw new Error("unexpected blob");
}

function split(data: Uint8Array): Uint8Array[] {
  const pieces: Uint8Array[] = [];
  for (let at = 0; at < data.length; at += CHUNK_BYTES) {
    pieces.push(data.subarray(at, at + CHUNK_BYTES));
  }
  return pieces.length > 0 ? pieces : [new Uint8Array()];
}

export function d1Store(db: D1Database): BackupStore {
  return {
    async get(email) {
      const row = await db
        .prepare(
          "SELECT revision, updated_at, write_id FROM backups WHERE email = ?",
        )
        .bind(email)
        .first<{ revision: number; updated_at: string; write_id: string }>();
      if (!row) return null;
      const { results } = await db
        .prepare(
          "SELECT data FROM backup_chunks WHERE email = ? AND write_id = ? ORDER BY idx",
        )
        .bind(email, row.write_id)
        .all<{ data: unknown }>();
      const pieces = results.map((piece) => toBytes(piece.data));
      const data = new Uint8Array(pieces.reduce((n, p) => n + p.length, 0));
      let at = 0;
      for (const piece of pieces) {
        data.set(piece, at);
        at += piece.length;
      }
      return { revision: row.revision, updatedAt: row.updated_at, data };
    },

    async revision(email) {
      const row = await db
        .prepare("SELECT revision FROM backups WHERE email = ?")
        .bind(email)
        .first<{ revision: number }>();
      return row?.revision ?? 0;
    },

    async save(email, base, data) {
      const writeId = crypto.randomUUID();
      const updatedAt = new Date().toISOString();
      const pieces = split(data);
      const pointer =
        base === 0
          ? db
              .prepare(
                "INSERT INTO backups (email, revision, write_id, updated_at, size) VALUES (?, 1, ?, ?, ?) ON CONFLICT(email) DO NOTHING",
              )
              .bind(email, writeId, updatedAt, data.length)
          : db
              .prepare(
                "UPDATE backups SET revision = revision + 1, write_id = ?, updated_at = ?, size = ? WHERE email = ? AND revision = ?",
              )
              .bind(writeId, updatedAt, data.length, email, base);
      const results = await db.batch([
        ...pieces.map((piece, idx) =>
          db
            .prepare(
              "INSERT INTO backup_chunks (email, write_id, idx, data) VALUES (?, ?, ?, ?)",
            )
            .bind(email, writeId, idx, piece),
        ),
        pointer,
      ]);
      const moved = results[results.length - 1].meta.changes === 1;
      // Drop every piece that isn't the current record's: the previous
      // write's after a save, this one's after a refusal.
      await db
        .prepare(
          "DELETE FROM backup_chunks WHERE email = ? AND write_id IS NOT (SELECT write_id FROM backups WHERE email = ?)",
        )
        .bind(email, email)
        .run();
      if (!moved) return { ok: false, revision: await this.revision(email) };
      return { ok: true, revision: base + 1, updatedAt };
    },
  };
}
