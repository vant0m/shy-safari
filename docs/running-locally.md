# Running Shy Safari locally, step by step

From a fresh computer to the app running in your browser, then to the
production build tested locally. About ten minutes the first time.

French version: [fr/lancer-en-local.md](fr/lancer-en-local.md).

## Step 1 — Install the tools

You need **Git** and **Bun** (Bun is both the JavaScript runtime and the
package manager; no Node or npm needed).

**Windows** (PowerShell):

```powershell
winget install Git.Git          # if Git isn't installed yet
powershell -c "irm bun.sh/install.ps1 | iex"
```

**macOS / Linux**:

```sh
# Git is already there on most systems (otherwise: brew install git / apt install git)
curl -fsSL https://bun.sh/install | bash
```

Then **close and reopen the terminal** (Bun joins the `PATH` in new terminals)
and check:

```sh
git --version
bun --version     # 1.3 or newer
```

Use a recent Chrome, Edge or Firefox. Floating the Scene
(Picture-in-Picture) only works in Chrome and Edge.

## Step 2 — Get the code

```sh
git clone https://github.com/vant0m/shy-safari.git
cd shy-safari
```

Already cloned? Go to its folder and `git pull`.

## Step 3 — Install the dependencies

```sh
bun install
```

Run it again after any `git pull` that changes `bun.lock`.

## Step 4 — Start the dev server

```sh
bun run dev
```

Open the address it prints, normally **http://localhost:5173**, then:

1. Pick a Scene (the savanna by default).
2. Press **Start**.
3. Allow the microphone when the browser asks. Audio is measured on the
   computer, never recorded or sent.

The page reloads by itself when you change a file in `src/`. Stop the server
with **Ctrl + C**.

## Step 5 — Try the app without waiting

- Move the mouse to show the controls, then **Settings → Try it out → Bring
  out every animal**: the whole Roster appears at once, the Legendary and its
  rainbow included. These don't count towards the Collection.
- In **Settings**, choose **Lively** (about one animal every 2 minutes) or
  type **1** minute to speed up real arrivals.
- **Reset** (bottom bar) empties the Scene for the Class on screen.
- **Statistics** (bottom right) fills in while a Session runs.
- To start from scratch: browser dev tools (**F12**) → **Application** →
  **Local storage** → `http://localhost:5173` → delete the keys starting with
  `class-noise-level:`.

Local storage belongs to one address: `localhost:5173` (dev) and
`localhost:4173` (production, step 6) keep separate data.

## Step 6 — Test the production build

This is what actually goes online: static files in `build/`.

```sh
bun run build
bun run preview
```

Open **http://localhost:4173**. To serve the files the way the Cloudflare
Worker does (caching from `static/_headers`, redirects from
`static/_redirects`, the 404 page):

```sh
bun run build
bunx wrangler dev
```

and open the address it prints (normally **http://localhost:8787**).

`wrangler dev` simulates **only the Worker** and its files. Anything set up in
the Cloudflare dashboard in front of the Worker does not exist locally: **no
Cloudflare Access sign-in page**, no bare-domain-to-`www` redirect, no custom
domain or HTTPS. To test Access you have to deploy (see
[hosting.md](hosting.md#checking-that-access-works)).

After a new `bun run build`, **restart** `bun run preview`: a preview server
that was already running keeps serving the old files, and the page can stay
blank.

## Optional — run the sync Worker locally

To work on sync (`worker/`, `src/lib/sync/`), create a file named `.dev.vars`
(never committed) with a made-up teacher address:

```sh
DEV_USER_EMAIL=teacher@example.org
```

then:

```sh
bun run dev:sync
```

It builds the site, creates the local database tables and serves everything
at **http://localhost:8787** as a signed-in teacher (there is no Access page
locally). A second browser profile acts as a second computer.

## Step 7 — Check before committing

```sh
bun run check    # TypeScript / Svelte
bun test         # unit tests
bun run lint     # Prettier + ESLint (bun run format fixes formatting)
bun run build    # the production build succeeds
```

## Useful options

| Variable            | What it does                                                        |
| ------------------- | ------------------------------------------------------------------- |
| `PUBLIC_SITE_URL`   | The site's public address, used in links, the sitemap and the help. |
| `CF_BEACON_TOKEN`   | Turns on Cloudflare Web Analytics (leave unset locally).            |
| `DEV_ALLOWED_HOSTS` | Hostnames the dev server accepts behind a tunnel or proxy.          |
| `BUILD_VERSION`     | The build's version name (default: the git commit).                 |

Set one for a single command with `PUBLIC_SITE_URL=https://noise.example.org
bun run build` (macOS/Linux) or
`$env:PUBLIC_SITE_URL="https://noise.example.org"; bun run build` (PowerShell).

- **Another port:** `bun run dev -- --port 3000`.
- **From a tablet or another computer on the network:** run
  `bun run dev -- --host`, then open `http://<computer-ip>:5173`. The page
  loads, but **the microphone won't**: browsers only allow it over HTTPS or on
  `localhost`. Use an HTTPS tunnel and list its hostname in
  `DEV_ALLOWED_HOSTS`.

## Troubleshooting

| Symptom                                              | Fix                                                                                                                                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun: command not found`                             | Close and reopen the terminal. On Windows Bun lives in `%USERPROFILE%\.bun\bin`.                                                                                                   |
| `bun install` fails                                  | `bun upgrade`.                                                                                                                                                                     |
| `Port 5173 is in use`                                | Stop the other server, or use `--port`.                                                                                                                                            |
| No microphone prompt / "microphone blocked"          | Click the icon left of the address and allow the microphone; make sure you're on `localhost`.                                                                                      |
| Blank page with `bun run preview`                    | Stop it, `bun run build` again, restart `bun run preview`.                                                                                                                         |
| `bun run lint` fails on almost every file on Windows | CRLF line endings: the repo enforces LF in `.gitattributes`. In a checkout made before that file, with **no uncommitted changes**, run `git rm --cached -r . && git reset --hard`. |
| Animals or classes "disappeared"                     | You're on another address (`5173` / `4173` / `8787`) or a private window: each has its own storage.                                                                                |

To put the site online, see [hosting.md](hosting.md).
