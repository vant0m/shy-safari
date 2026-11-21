# Agent and contributor notes

Shy Safari began as a prototype built during the 3-day "EdTech-a-thon" event
([teacherdotdev/shy-safari](https://github.com/teacherdotdev/shy-safari), by
[Duncan A. Johnson](https://github.com/DuncanAJohnson) and
[Elliot Roe](https://github.com/ElliotRoe)); this copy is maintained for
long-term hosting. See `README.md` for what it does and `CHANGELOG.md` for
what changed since.

## Tech stack

- Runtime and package manager: Bun
- Language: TypeScript
- Build tool: Vite (SvelteKit), with `adapter-static`
- UI: Svelte 5, Tailwind CSS
- Linter / formatter: ESLint, Prettier
- Rendering: DOM and SVG rather than canvas, for accessibility
  ([ADR 0002](docs/adr/0002-svg-dom-scene.md))
- Hosting: Cloudflare Workers static assets; optional sync Worker and D1
  database ([ADR 0015](docs/adr/0015-sync-through-cloudflare.md))

## Data and persistence

- ~~Follow this hierarchy — no data, then `localStorage`, then Supabase only if
  real accounts or shared persistence are strictly necessary.~~ _Superseded:
  this rule from the event no longer applies._
- Today: everything is kept in the browser's `localStorage` by default, with
  Export / Import to move it ([ADR 0011](docs/adr/0011-backup-export-import.md)).
  A copy can turn on server-side sync through Cloudflare Access and D1
  ([ADR 0015](docs/adr/0015-sync-through-cloudflare.md)). Storage changes
  must migrate existing data rather than reset it.

## Before committing

```sh
bun run check && bun test && bun run lint && bun run build
```

## Releasing

Versions follow SemVer. For version `X.Y.Z`:

1. Bump `version` in `package.json`.
2. In `CHANGELOG.md` and `docs/fr/CHANGELOG.md`, turn the Unreleased section
   into `## [X.Y.Z] — YYYY-MM-DD` (with a one-line summary), open a new empty
   Unreleased, and add the `[X.Y.Z]: …/compare/vPREV...vX.Y.Z` link.
3. Update the version rows in `README.md` and `docs/fr/README.md`.
4. Commit (`chore(release): X.Y.Z`), then tag it, signed:
   `git tag -s vX.Y.Z -m "Shy Safari X.Y.Z"`.
5. Push `main` and the tag. `.github/workflows/release.yml` then publishes
   the GitHub Release page: the version's notes from `CHANGELOG.md`
   (`scripts/release-notes.ts`) and `shy-safari-X.Y.Z.zip`, the built site.
   Check that the Release is there; "Run workflow" on it, with the tag,
   publishes or refreshes one.

Decisions and their reasons live in `docs/adr/`; the vocabulary the code uses
is in `CONTEXT.md`.
