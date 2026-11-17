-- Each teacher's synced record (docs/adr/0015-sync-through-cloudflare.md).
-- `backups` points at the current write; its bytes are in `backup_chunks`,
-- in pieces of at most 90 KB, because D1 caps a statement at 100 KB.

CREATE TABLE IF NOT EXISTS backups (
  email TEXT PRIMARY KEY,
  revision INTEGER NOT NULL,
  write_id TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  size INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS backup_chunks (
  email TEXT NOT NULL,
  write_id TEXT NOT NULL,
  idx INTEGER NOT NULL,
  data BLOB NOT NULL,
  PRIMARY KEY (email, write_id, idx)
);
