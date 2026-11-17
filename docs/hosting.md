# Hosting Shy Safari

Shy Safari builds to plain static files (`bun run build` → `build/`). There is
no server code and no database: everything a class earns is kept in the
teacher's browser. Hosting it means serving those files over HTTPS from one
stable address.

French version: [fr/hebergement.md](fr/hebergement.md).

- [Before you start](#before-you-start)
- [Option A — Cloudflare, from your computer](#option-a--cloudflare-from-your-computer)
- [Option B — Cloudflare, built from GitHub on every push](#option-b--cloudflare-built-from-github-on-every-push)
- [Your own domain](#your-own-domain)
- [Restricting access with Cloudflare Access](#restricting-access-with-cloudflare-access)
- [Sync between computers (optional)](#sync-between-computers-optional)
- [Other static hosts](#other-static-hosts)
- [Updating and rolling back](#updating-and-rolling-back)
- [Troubleshooting](#troubleshooting)

## Before you start

Two rules hold whatever the host:

1. **HTTPS.** Browsers only let secure pages use the microphone. `localhost`
   is treated as secure for development; anything else needs HTTPS.
2. **One canonical address.** The animals, Collection, Notes, Timer and
   settings live in `localStorage`, which belongs to one exact origin
   (scheme + host + port). `https://example.org` and `https://www.example.org`
   are two separate stores: a teacher who uses both sees two different sets of
   classes. Choose one address, redirect every other one to it, and do not
   change it once teachers rely on it. If you ever must move, teachers can
   carry their classes across with **Export / Import** in the Classes panel.

Set `PUBLIC_SITE_URL` at build time to that canonical address (for example
`https://noise.example.org`). It is used for canonical links, the sitemap,
link previews and the "Open … on the computer" line in the help. Left unset,
it defaults to `https://www.shysafari.com`.

`CF_BEACON_TOKEN` is optional and only adds Cloudflare Web Analytics. Leave
it unset and the site loads no analytics script at all.

## Option A — Cloudflare, from your computer

Cloudflare Workers can serve static assets with no Worker script at all, which
is free and has no request limit. `wrangler.jsonc` already describes this.

1. Create a free Cloudflare account.
2. Install [Bun](https://bun.sh) and the dependencies:

   ```sh
   bun install
   ```

3. Change `"name"` in `wrangler.jsonc` if `shy-safari` is not the name you
   want in your Cloudflare dashboard (it also becomes the
   `<name>.<account>.workers.dev` address).
4. Log in and deploy:

   ```sh
   bunx wrangler login
   PUBLIC_SITE_URL=https://noise.example.org bun run build
   bunx wrangler deploy
   ```

   On Windows PowerShell, set the variable first:
   `$env:PUBLIC_SITE_URL="https://noise.example.org"; bun run build`.

Wrangler prints the `*.workers.dev` address. The site works there straight
away; add your own domain below.

## Option B — Cloudflare, built from GitHub on every push

1. Push the repository to GitHub (or GitLab).
2. In the Cloudflare dashboard: **Workers & Pages → Create → Import a
   repository**, and pick it.
3. Build settings:

   | Setting           | Value                          |
   | ----------------- | ------------------------------ |
   | Build command     | `bun install && bun run build` |
   | Deploy command    | `bunx wrangler deploy`         |
   | Root directory    | `/`                            |
   | Production branch | `main`                         |

4. **Settings → Variables and secrets → Build variables**: add
   `PUBLIC_SITE_URL` (and `CF_BEACON_TOKEN` if you want analytics).
5. Every push to `main` now builds and deploys; pushes to other branches get
   preview URLs.

## Your own domain

1. Add the domain to Cloudflare (its nameservers must point to Cloudflare), or
   use a subdomain of a domain that is already there.
2. **Workers & Pages → your Worker → Settings → Domains & Routes → Add →
   Custom domain**, and enter the canonical host, e.g. `www.example.org` or
   `noise.example.org`. Cloudflare creates the DNS record and the certificate.
3. If you use `www.`, also add the bare domain as a custom domain and redirect
   it: **Rules → Redirect Rules → Create rule → "Redirect from root to WWW"**
   template (301, keep the path and query string). The reverse works the same
   way if the bare domain is your canonical one.
4. Optionally turn off the `workers.dev` address (**Domains & Routes →
   workers.dev → Disable**) so nobody starts using it by mistake: it would be a
   second origin with its own, separate classes.
5. Rebuild with `PUBLIC_SITE_URL` set to the canonical address.

## Restricting access with Cloudflare Access

The app itself has no login. To keep a copy for your school only, put
[Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/)
in front of it. Nothing changes in the code, and **teachers never create an
account or a password**: the person who administers the Cloudflare account
decides who may come in.

How it feels for a teacher:

1. They open the site and get a Cloudflare sign-in page.
2. They type their e-mail address. If it is on the allowed list, Cloudflare
   e-mails them a 6-digit code (a "one-time PIN").
3. They type the code and land on Shy Safari. They stay signed in for the
   session duration you choose (say a month), so the projector computer does
   not ask every morning.

Alternatively, if the school uses Google Workspace or Microsoft 365, you can
let them sign in with that account instead of a code.

Setting it up (once, by the administrator):

1. Your domain must be on Cloudflare (see above). For the `workers.dev`
   address only, use **Worker → Settings → Domains & Routes → workers.dev →
   Enable Cloudflare Access** instead, and edit the policy it creates.
2. Open **Zero Trust** from the dashboard (the free plan covers up to 50
   users; choose a team name when asked).
3. **Settings → Authentication → Login methods**: _One-time PIN_ is there by
   default. Add Google or Microsoft (Azure AD) here if you want those.
4. **Access → Applications → Add an application → Self-hosted**:
   - Application name: `Shy Safari`.
   - Session duration: e.g. `1 month`.
   - Application domain: your canonical host, e.g. `www.example.org`. Add a
     second entry for the bare domain (`example.org`) if it redirects, so the
     redirect itself is protected too.
5. Add a policy:
   - Action: **Allow**.
   - Include: **Emails** (list each teacher's address), or **Emails ending
     in** `@school.example.org` to let a whole domain in.
6. Save. The site now asks for the code; add or remove teachers later by
   editing the policy. Removing someone takes effect when their current
   session runs out (or immediately, via **Revoke existing tokens**).

### Checking that access works

Cloudflare Access runs at Cloudflare, in front of the site: it never appears
locally, neither with `bun run dev` nor with `bunx wrangler dev`. To see it:

1. Deploy (option A or B). To try it without touching the teachers' site,
   deploy a test copy under another name:
   `bunx wrangler deploy --name shy-safari-test`, and protect its
   `workers.dev` address as in step 1 above.
2. Open the protected address in a **private window** (with no Cloudflare
   session already open): the Cloudflare sign-in page must appear before the
   app.
3. Enter an allowed address: the code arrives by e-mail and the app opens.
   With an address that isn't allowed, Cloudflare refuses access.
4. **Zero Trust → Logs → Access** lists every attempt, allowed or denied.

Notes:

- The about and privacy pages are protected too. If you want them public,
  add a second application for `www.example.org/about` (and `/privacy`) with
  a **Bypass** policy that includes **Everyone**.
- Each person who signs in uses one of the 50 free seats.
- Access is a real check at Cloudflare's edge: the files are never sent to
  someone who has not signed in. It does not separate teachers from each
  other inside the app — each browser still keeps its own classes.

## Sync between computers (optional)

By default everything stays in each browser. A copy behind Cloudflare Access
can also save each teacher's classes on its Cloudflare account (a D1
database), keyed by the e-mail they sign in with, so they find them on any
computer: deploy with `wrangler.sync.jsonc` instead of `wrangler.jsonc`.
Only `/api/*` runs a Worker; every page is still served as static files.

The whole setup, from an empty Cloudflare account to two computers in step,
is in **[deploy-step-by-step.md](deploy-step-by-step.md)** (French:
[fr/deploiement-pas-a-pas.md](fr/deploiement-pas-a-pas.md)). Design and
limits: [ADR 0015](adr/0015-sync-through-cloudflare.md).

## Other static hosts

Any host that serves static files over HTTPS works. Build with
`PUBLIC_SITE_URL` set, then publish the `build/` folder.

- **Netlify**: build command `bun run build`, publish directory `build`.
  `static/_headers` and `static/_redirects` use Netlify's format and are
  picked up as they are.
- **GitHub Pages / GitLab Pages**: publish `build/`. The site must be at the
  root of its domain (a custom domain, or `<user>.github.io`), not in a
  sub-path, unless you set `paths.base` in the SvelteKit config. Caching
  headers in `_headers` are ignored there; nothing breaks.
- **Your own server (nginx, Apache, Caddy)**: copy `build/` to the web root.
  Serve `404.html` for missing paths, redirect `/how-it-works` to
  `/#how-it-works`, and give `/_app/immutable/*` a long cache
  (`Cache-Control: public, max-age=31536000, immutable`). With nginx:

  ```nginx
  location /_app/immutable/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
  location = /how-it-works { return 301 /#how-it-works; }
  error_page 404 /404.html;
  try_files $uri $uri.html $uri/ =404;
  ```

  For a login without Cloudflare, HTTP basic auth on the server
  (`auth_basic` in nginx) is the simplest equivalent.

## Updating and rolling back

- Option A: pull, `bun install`, build, `bunx wrangler deploy` again.
- Option B: push to `main`.
- Roll back from **Worker → Deployments**, or `bunx wrangler rollback`.

Updates never touch what teachers have saved: it stays in their browsers.
Storage keys are migrated in code when their layout changes, so an update
must never be what empties a class.

## Troubleshooting

- **"Microphone blocked" / no prompt**: the page is not on HTTPS, or the
  browser's site permission was denied. Check the padlock icon.
- **A teacher's classes "disappeared"**: they are almost always on a
  different origin (`www` vs. bare domain, `workers.dev` vs. custom domain,
  another browser or profile). Go back to the usual address; use Export /
  Import to move them for good.
- **Private / incognito windows** forget everything when closed.
- **Build fails on `bun install`**: the lockfile wants Bun 1.3+; run
  `bun upgrade`.
