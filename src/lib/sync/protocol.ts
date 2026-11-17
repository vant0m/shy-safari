/**
 * What the app and the sync Worker (`worker/`) agree on. Imported by both,
 * so it must stay free of `$lib` and `$app` imports
 * (docs/adr/0015-sync-through-cloudflare.md).
 */

/** Sent with every save: a cross-site form cannot send a custom header. */
export const WRITE_HEADER = "X-Shy-Safari";
/** The revision a save builds on; 0 for a teacher's first save. */
export const BASE_REVISION_HEADER = "X-Base-Revision";
/** The revision of the record sent back, and when it was saved. */
export const REVISION_HEADER = "X-Revision";
export const UPDATED_AT_HEADER = "X-Updated-At";

/** The largest record accepted, compressed. */
export const MAX_SYNC_BYTES = 2_000_000;
/** D1 caps a statement at 100 KB, so a record is stored in pieces. */
export const CHUNK_BYTES = 90_000;

export interface MeResponse {
  email: string;
}

export interface SavedResponse {
  revision: number;
  updatedAt: string;
}

export interface RevisionResponse {
  /** 0 when the teacher has nothing saved yet. */
  revision: number;
}

export interface ConflictResponse {
  revision: number;
}
