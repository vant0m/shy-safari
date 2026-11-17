# Classes move between computers as a file, not through an account

> Copies that turn on sync ([0015](0015-sync-through-cloudflare.md)) also
> keep each teacher's classes on the school's Cloudflare account. Export /
> Import is unchanged and still the way to move classes elsewhere.

Everything a teacher earns lives in one browser's `localStorage`, on one
origin. That is the point (no accounts, nothing leaves the device), but it
strands a teacher who gets a new laptop, switches browser, or whose school
moves the app to another address.

Per the AGENTS.md data hierarchy, an account and a database (Supabase) are
only for when shared persistence is strictly necessary. Moving one teacher's
data occasionally is not that. So the Classes panel offers **Export all
classes** and **Import a file…** (`src/lib/backup/backup.ts`).

## Decisions

- **The file is the raw storage.** Every key under `class-noise-level:` and
  its value as saved, wrapped in `{ app: "shy-safari", version, exportedAt,
data }`. No separate schema to keep in step: whatever migrations the app
  applies to old keys apply to imported ones too.
- **Machine-specific settings stay behind.** The microphone choice and its
  calibration describe the computer, so they are stripped on export and the
  importing computer keeps its own.
- **Import replaces; it does not merge.** Classes have random ids per
  computer, and merging two Collections or two sets of Notes has no answer a
  teacher would predict. The confirm dialog says plainly that everything is
  replaced.
- **Then the page reloads**, because every store reads the Class on screen
  once at start-up.
- **Validation is strict.** Wrong app, newer version, no class list, or a
  file over 5 MB is refused with a message; foreign keys and non-text values
  are dropped.

If cross-device sync is ever truly needed (several teachers sharing a class,
say), that is the point at which a backend becomes justified — not before.
