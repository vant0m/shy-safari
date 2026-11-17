# Shy Safari

A calm scene on the classroom projector — a savanna, a coral reef, deep
space, the age of dinosaurs, a woodland clearing, the jungle, the Arctic or an enchanted valley — where animals (or, in deep space, sightings
through a telescope) come out the longer the room stays quiet. The animals are shy: if the room is too loud,
they stay hidden until it is calm again.

It is the opposite of a noise meter. There is no bouncing, no score, no red
warning light — nothing that makes being loud more interesting than being
quiet. The class starts with an empty scene. The first animal comes out
after 10–20 quiet seconds, as a taste of what is coming; after that, every few
minutes of quiet working brings another one. Some of them are rare, and each
scene hides one legendary creature that comes in about one arrival in two
hundred, with a rainbow.

French documentation: [docs/fr/README.md](docs/fr/README.md).

## What a teacher does

1. Open the page and press **Start listening**. The browser asks for the
   microphone; audio is measured on the computer and never recorded or sent
   anywhere.
   Pick **Savanna** (zebras, giraffes, lions), **Coral reef** (fish,
   turtles, sharks), **Deep space** (satellites, comets, galaxies),
   **Prehistoric** (T. rex, Triceratops, feathered raptors), **Forest**
   (squirrels, foxes, deer), **Jungle** (sloths, toucans, jaguars) or
   **Arctic** (polar bears, seals, narwhals) or the **Enchanted valley**
   (unicorns, dragons, mermaids) first if you like. Deep space and
   the prehistoric scene are drawn to appeal to older students too.
2. Press **Start**. The class begins earning animals.
3. Move the mouse to bring up the controls. **Settings** has everything:
   which scene, which microphone, how loud is too loud, and how often animals
   arrive. Each scene keeps its own animals, so switching never loses any.

That is the whole app. No account, no sign-in, nothing to install.

## Classes, backups and statistics

- **Classes.** A teacher who sees several groups names a class for each
  ("2nd period"). Each class keeps its own animals in every scene, its own
  Collection, Notes and Timer, **and its own settings**: volume goal, arrival
  rate, what happens when it is too loud, and the scene it was last on. The
  microphone and its calibration belong to the room and are shared
  ([docs/adr/0010](docs/adr/0010-settings-per-class.md)).
- **Export / Import.** The Classes panel saves every class to a JSON file
  and restores it on another computer, browser or address. Import replaces
  what is there and keeps this computer's microphone settings
  ([docs/adr/0011](docs/adr/0011-backup-export-import.md)).
- **Rarity.** Common 60, uncommon 30, rare 10 and legendary 0.5 (about
  0.5% of arrivals). A rare comes at most once while it is on screen; a
  legendary at most once per session, and it arrives under a rainbow
  ([docs/adr/0012](docs/adr/0012-legendary-tier.md)).
- **Statistics.** The chart button opens each class's quiet time, share of
  time under the goal, arrivals, creatures that ran away, the average noise
  level through the day against the goal, and a comparison of every class.
  Teacher-facing only, kept on this computer for 180 days
  ([docs/adr/0014](docs/adr/0014-class-statistics.md)).
- **Access control** is done in front of the site, not in it: Cloudflare
  Access with e-mailed one-time codes, set up by whoever administers the
  hosting ([docs/hosting.md](docs/hosting.md#restricting-access-with-cloudflare-access),
  [docs/adr/0013](docs/adr/0013-access-via-cloudflare-access.md)).

## How it decides the room is too loud

The teacher sets a **Volume Goal** — Silent, Independent or Partner work, or
anywhere in between by dragging the line on the meter. While the room stays
under it, animals arrive. To watch the room's level live without opening
Settings, turn on **Show on screen** beside the Noise Meter: it stays at the
top of the scene until you turn it off.

Going over the line does not instantly stop anything. Noise over the goal
fills up a bucket, and the further over, the faster it fills: just over the
line takes about **six seconds** to pause arrivals, far over takes about
**one second**. Quiet moments drain the bucket again, so a knock at the door or
a dropped book costs the class nothing. Recovery takes only **three seconds**,
because a class that settles down should be rewarded immediately rather than
serve a sentence.

When the room is too loud, the whole scene slowly clouds over — a dusty haze
on the savanna, murky water on the reef, interference in deep space, mist off the river in the
prehistoric scene, fog between the trees in the forest, a tropical downpour in the jungle, a whiteout of blowing snow in the Arctic. That is
the only signal the class sees. The shy animals simply wait to come out:
nothing already out runs away, nothing gets startled, and progress
toward the next animal pauses rather than resetting — a loud spell costs
exactly the time it lasted. This is deliberate; see
[docs/adr/0001](docs/adr/0001-nothing-is-taken-away.md).

**Calibration** is optional. The app works on a sensible default, and
calibrating — five seconds of silence, five seconds of normal talking — makes
the meter match your room and your microphone.

## Running it locally

A step-by-step guide, from installing the tools to testing the production
build, is in [docs/running-locally.md](docs/running-locally.md) (French:
[docs/fr/lancer-en-local.md](docs/fr/lancer-en-local.md)). The short version:

You need [Bun](https://bun.sh) 1.3 or newer (it is both the runtime and the
package manager here). On Windows, `powershell -c "irm bun.sh/install.ps1 | iex"`;
on macOS or Linux, `curl -fsSL https://bun.sh/install | bash`.

```sh
bun install      # once, and after every pull that changes bun.lock
bun run dev      # dev server on http://localhost:5173
```

The microphone only works in a secure context: `localhost` counts, but a dev
server opened from another machine by IP address does not. To reach the dev
server through a tunnel or reverse proxy, list its hostname in
`DEV_ALLOWED_HOSTS` (comma-separated).

Before committing:

```sh
bun run check    # svelte-check / TypeScript
bun test         # unit tests
bun run lint     # prettier --check + eslint (bun run format fixes formatting)
bun run build    # static production build into build/
```

`bun run build && bunx wrangler dev` serves the built site the way the
Cloudflare Worker does, `_headers` and `_redirects` included. It does not
simulate what is configured in front of the Worker, such as Cloudflare Access
or redirect rules.

## Hosting it

The build is plain static files, so it can live on any static host. The
reference setup is Cloudflare Workers static assets (`wrangler.jsonc`), which
is free and needs no server code. **[docs/hosting.md](docs/hosting.md)** walks
through deploying your own copy, using your own domain, protecting it with a
login (Cloudflare Access, no accounts for teachers to create) and the other
hosts it works on. A French version is in
[docs/fr/hebergement.md](docs/fr/hebergement.md).

Two things to keep in mind whatever the host:

- **One address only.** Every class's animals, Collection, Notes and settings
  live in the browser's `localStorage`, which belongs to one exact origin.
  `example.com` and `www.example.com` are two different stores, so pick one
  canonical address and redirect the other to it.
- **HTTPS is required**, because browsers only give the microphone to secure
  pages.

Build-time variables (all optional):

| Variable          | Effect                                                                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_SITE_URL` | The site's canonical address, e.g. `https://noise.example.org`. Used for canonical links, the sitemap, social previews and the help text. Defaults to `https://www.shysafari.com`. |
| `CF_BEACON_TOKEN` | Adds Cloudflare Web Analytics. Leave unset for no analytics at all.                                                                                                                |

## How it is put together

Svelte 5 and SvelteKit, prerendered to static files with Tailwind for styling.
There is no backend: settings live in `localStorage` and nothing leaves the
device.

Each scene is SVG in the DOM rather than video or canvas
([docs/adr/0002](docs/adr/0002-svg-dom-scene.md)), so each animal is an
ordinary element that CSS animates.

The three decisions that matter most are pure functions with unit tests, so
they can be checked without a microphone or a ten-second wait:

- `src/lib/noise/loudState.ts` — the slow-in, fast-out hysteresis.
- `src/lib/session/arrivalClock.ts` — banking quiet time, and pausing rather
  than resetting.
- `src/lib/session/roll.ts` — the weighted rarity roll.
- `src/lib/settings/stored.ts` — the room / class split of the settings.
- `src/lib/backup/backup.ts` — export and import.
- `src/lib/stats/statsData.ts` — recording and summing statistics.

## Documentation

- [`CONTEXT.md`](CONTEXT.md) — the vocabulary the code uses (Scene, Creature,
  Class, Too Loud…).
- [`docs/hosting.md`](docs/hosting.md) — deploying, domains, access control.
- [`docs/adr/`](docs/adr/README.md) — architecture decisions and why they were made.
- [`docs/svg-art-brief.md`](docs/svg-art-brief.md) — the rules every piece of
  artwork follows.
- [`docs/fr/`](docs/fr/) — French documentation for teachers and hosts.

The art brief started with the reef; the savanna, the forest, the jungle and
the Arctic follow its style rules, and deep space, the prehistoric scene, the
forest, the jungle and the Arctic each have their own section there.
