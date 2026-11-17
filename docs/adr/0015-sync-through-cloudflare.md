# Optional sync: each teacher's classes saved on the school's Cloudflare

Supersedes, for copies that turn it on, the "nothing leaves the device" part of
[0011](0011-backup-export-import.md). Export / Import stays.

A school hosting its own copy wanted teachers to find their classes on any
computer, without moving files by hand. That needs persistence on a server,
and a way to tell teachers apart.

## Decisions

- **Opt-in, per copy.** The default `wrangler.jsonc` stays static files only:
  no Worker script, no database, nothing to configure, and shysafari.com keeps
  working exactly as before. A copy that wants sync deploys with
  `wrangler.sync.jsonc` instead, which adds a Worker for `/api/*` only
  (`run_worker_first: ["/api/*"]`; every other request is served straight from
  the assets) and a D1 database.
- **Identity comes from Cloudflare Access** ([0013](0013-access-via-cloudflare-access.md)).
  Teachers still never create an account: the e-mail they sign in with is the
  key their classes are saved under. The Worker **verifies the Access JWT**
  (`Cf-Access-Jwt-Assertion`: RS256 against the team's published keys,
  issuer = the team domain, audience = the application's AUD tag, not
  expired) and never trusts an e-mail header, since `workers.dev` and preview
  URLs are not behind Access.
- **Fail closed.** Without a team domain, an AUD tag and the database, `/api/*`
  answers 503 and the app behaves as if there were no sync. The only
  exception is local development: with no AUD, a `DEV_USER_EMAIL` in
  `.dev.vars`, and a request to `localhost`.
- **D1 rather than Supabase** (AGENTS.md names Supabase for shared
  persistence): the copy already runs on Cloudflare and Access already gives
  the identity, so D1 adds no second provider, no second login and no keys
  to manage. The free plan is ample for a school.
- **What is stored is the export file, gzipped, as opaque bytes.** The same
  data as Export / Import (`src/lib/backup/backup.ts`), without the
  microphone or calibration. The Worker never parses it (the free plan's CPU
  budget is small); the app validates it when it downloads it. It is split
  into 90 KB pieces, because D1 caps one SQL statement at 100 KB, and written
  in one transaction. 2 MB compressed at most.
- **One record per teacher, with a revision number.** A save says which
  revision it builds on; if the server has moved on, it is refused (409) and
  the teacher chooses. Nothing is ever overwritten silently:
  - a computer with nothing of its own yet (one unnamed class, no animals,
    sightings, notes or statistics) downloads the teacher's classes
    without asking — the main case, a new or shared computer;
  - a computer whose classes have changed since its last sync, while the
    server's have too, first merges them entry by entry: it remembers a short
    hash of each entry as of the last sync, so an entry only one side changed
    is taken from that side. Entries that change on their own all the time
    (statistics, the arrival counter, the Timer, a Class's settings and
    Scene, which Class is on screen, seen menus, the language) are settled
    automatically: statistics by keeping each day's larger figures, the rest
    by keeping this computer's.
    Only when both sides changed the same real thing (a Note, a Scene's
    animals, the class list…) does it ask which copy to keep;
  - if the server already holds exactly this computer's classes (a save
    whose answer was lost when the tab closed), it just carries on;
  - a computer last synced by another teacher never uploads on its own: it
    asks first, so one teacher's classes never land in another's record.
- **When it saves**: when something changed, at most once a minute, and when
  the tab is hidden. Not reliably on close: browsers cap a request sent while
  a page closes at about 64 KB.
- **Errors are never data.** Only a JSON answer from the API counts. A
  missing route (the plain static build), an HTML page, a sign-in redirect
  (an expired Access session) or a network failure means "not now": the app
  carries on locally and tries again later; it never uploads, downloads or
  asks on the strength of an error.
- **Writes need a custom header** (`X-Shy-Safari: 1`), which a cross-site form
  cannot send.

## Known limits of this first version

- Merging is per entry, not inside an entry: two computers changing the same
  Scene's animals for the same Class between syncs must choose.
- A merge or a download reloads the page, since every store reads its data
  once at start-up.
- Deleting a teacher's data is done by the administrator, in D1
  (`DELETE FROM backups WHERE email = ...`).
