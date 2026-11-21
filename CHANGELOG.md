# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/). French version:
[docs/fr/CHANGELOG.md](docs/fr/CHANGELOG.md).

## [Unreleased]

### Added

- **Christmas chalet**, a second limited-time Scene (1 December 2026 to
  8 January 2027): a Christmas village at night under the northern lights,
  with chalets, lit fir trees, a lamp post, a candy-striped fence, chimney
  smoke and falling snow. Father Christmas lights the tree; Too Loud puts
  the village's lights out and fades the aurora. Twenty-one Creatures,
  including six reindeer told apart by one mark and Rudolph, with names and
  facts in English, Spanish and French
  ([ADR 0016](docs/adr/0016-christmas-chalet.md)).
- **Father Christmas's sleigh**, a Legendary that forms when Rudolph, Father
  Christmas and the sleigh are all on screen, celebrated by the sleigh ride:
  the sleigh loops across the starry sky leaving a golden trail. The room is
  not judged while it plays.
- A debug menu under `bun run dev` only: a fake microphone with a level
  set by hand, a pretend date, a faster arrival clock and arrivals on
  demand ([docs/running-locally.md](docs/running-locally.md)). It is left
  out of production builds.
- GitHub Actions workflows, one per check (typecheck, tests, lint, build),
  each with its own README badge.
- README screenshots and GIFs in `docs/images/`, and `docs/how-it-works.md`
  (French: `docs/fr/fonctionnement.md`).

### Changed

- Limited-time Scenes (Pumpkin Hollow, the Christmas chalet) stay seasonal
  but have their whole Roster from the first day: no more daily unlock,
  Newcomer guarantee, locked Collection cards or character preview. Their
  rules are shared in `src/lib/scenes/limited/`.
- One scale for every Creature (a person about 100px tall at the 1920px
  reference): Halloween's and Christmas's sizes fixed, Jack O. Lantern and
  Father Christmas now person-sized; checked by a proportions test.
- README (and its French mirror) restructured: centred masthead with logo,
  badges and a living-scene GIF; numbered sections with emoji; principles up
  front; one picture per feature; collapsible details; GitHub alerts;
  contributors; back-to-top links.

### Fixed

- A Rare's sparkles and a Legendary's rainbow halo no longer vanish when
  the class switches Scene and comes back, or the page reloads: they carry on
  for the time they had left (one minute, three for a Legendary).
- Once Father Christmas's sleigh has formed, Rudolph, Father Christmas and
  the sleigh no longer arrive again beside it.
- The README no longer says nothing runs away when it is too loud: animals
  run away by default (ADR 0003).

## [1.0.0] — 2026-11-17

First release maintained for long-term hosting, built on the EdTech-a-thon
prototype by Duncan A. Johnson and Elliot Roe
([teacherdotdev/shy-safari](https://github.com/teacherdotdev/shy-safari)).

### Added

- **Enchanted valley**, a ninth Scene: the `mythical-scene` branch's backdrop
  and fourteen creatures wired in, plus an impundulu, a will-o'-the-wisp, a
  centaur and Pegasus; Ambient Life, a lilac Too Loud mist, names, facts and
  help text in English, Spanish and French.
- **Legendary tier**: one creature per Scene (white lion, leafy seadragon,
  flying saucer, Torosaurus, white stag, black panther, white orca, Pegasus),
  about one arrival in two hundred, at most once per Session, arriving under a
  rainbow with a turning ring of colour; its own row and rainbow frame in the
  Collection.
- **Settings per Class**: Volume Goal, Arrival Rate, what Too Loud does and
  the Scene are kept for each Class; the microphone and calibration stay
  shared. Existing settings are migrated, never reset.
- **Export / Import** of every Class as a JSON file.
- **Statistics per Class**: quiet time, share of time under the goal,
  sessions, arrivals, creatures that ran away, rare and legendary sightings,
  the average noise level through the day against the goal, and a comparison
  of every Class. Kept 180 days.
- **Optional sync between computers** through a Cloudflare Worker and a D1
  database, keyed by the e-mail teachers sign in with through Cloudflare
  Access: quiet download on a new computer, automatic merge of changes made
  on two computers, a question only when both changed the same thing, never
  a reload or a question during a lesson (`wrangler.sync.jsonc`, `worker/`,
  `migrations/`).
- `PUBLIC_SITE_URL` (the site's own address), `DEV_ALLOWED_HOSTS` and
  `BUILD_VERSION` build variables.
- `bun run dev:sync` to run the sync Worker locally.
- Documentation in English and French: step-by-step local setup, hosting,
  Cloudflare Access, a step-by-step subdomain deployment with sync, ADRs
  0010–0015, an ADR index, `NOTICE` and this changelog.

### Changed

- The project's data rule ("no data, then `localStorage`, then Supabase only
  if strictly necessary") is retired: `localStorage` stays the default, and
  server-side sync is available as an option.
- Help text and the privacy page describe sync where a copy turns it on.
- The README credits the original project and authors.

### Fixed

- The build could produce a page that never started ("Cannot read properties
  of undefined (reading 'data')") when SvelteKit's default version,
  `Date.now()`, was read twice: the version is now the git commit.
- `bun run lint` failed on every file in Windows checkouts (CRLF line
  endings): `.gitattributes` keeps LF.
- The pre-mount Scene colours followed the old shared settings instead of the
  Class on screen.
- Self-hosted copies no longer name shysafari.com in their help, sitemap and
  links.

## [0.0.1] — 2026-11

The EdTech-a-thon prototype, as published at
[teacherdotdev/shy-safari](https://github.com/teacherdotdev/shy-safari):
seven Scenes and the limited-time Pumpkin Hollow, Classes, Notes, the Timer,
the Noise Meter, floating over other tabs, English, Spanish and French.

[1.0.0]: https://github.com/vant0m/shy-safari/compare/351b79c...v1.0.0
[0.0.1]: https://github.com/teacherdotdev/shy-safari
