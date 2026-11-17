# Deploying Shy Safari on a subdomain, with sign-in and sync

This guide puts Shy Safari online on a subdomain of a domain already on
Cloudflare (examples use **`safari.example.org`**; use your own domain), with:

- a **Cloudflare Access sign-in page** (a code sent by e-mail; teachers never
  create an account);
- **sync**: each teacher finds their classes on any computer they sign in on.

Everything runs at Cloudflare (free plan): **nothing is installed on a server
of yours**. A VPS hosting other services is left untouched; only a new `safari`
DNS record is added to the domain.

About 30 minutes. Background: [ADR 0013](adr/0013-access-via-cloudflare-access.md)
(sign-in) and [ADR 0015](adr/0015-sync-through-cloudflare.md) (sync). French
version: [fr/deploiement-pas-a-pas.md](fr/deploiement-pas-a-pas.md).

## Step 0 — Prerequisites

1. The domain is in your Cloudflare account, on Cloudflare's nameservers.
2. **Your domain → DNS → Records**: make sure **no `safari` record** exists.
3. Git, Bun and the code, as in [running-locally.md](running-locally.md)
   (steps 1–3): `git clone …`, `cd shy-safari`, `bun install`.

## Step 1 — Log Wrangler in

```sh
bunx wrangler login
bunx wrangler whoami
```

## Step 2 — Create the database

Your deployment settings go in a **local copy** of the configuration that
Git ignores, so they never reach GitHub and `git pull` never conflicts:

```sh
cp wrangler.sync.jsonc wrangler.sync.local.jsonc
# PowerShell: Copy-Item wrangler.sync.jsonc wrangler.sync.local.jsonc
bunx wrangler d1 create shy-safari
```

Copy the printed `database_id` into **`wrangler.sync.local.jsonc`**,
replacing `00000000-0000-0000-0000-000000000000`.

## Step 3 — Create the tables

```sh
bunx wrangler d1 migrations apply shy-safari --remote -c wrangler.sync.local.jsonc
```

## Step 4 — First deploy

```sh
PUBLIC_SITE_URL=https://safari.example.org bun run build
# PowerShell: $env:PUBLIC_SITE_URL="https://safari.example.org"; bun run build
bunx wrangler deploy -c wrangler.sync.local.jsonc
```

The site works at the printed `workers.dev` address, without sync for now
(it stays off until step 9, on purpose).

## Step 5 — Attach the subdomain

**Workers & Pages → shy-safari → Settings → Domains & Routes → Add → Custom
domain** → `safari.example.org`. Cloudflare creates the DNS record and the
certificate. Open https://safari.example.org.

## Step 6 — Close the other addresses

In **Domains & Routes**, disable **workers.dev** and **Preview URLs**: they
are not behind the sign-in page.

## Step 7 — Set up Cloudflare Zero Trust

1. **Zero Trust**: pick a **team name** and the **Free** plan (up to 50
   users).
2. Note your **team domain**, `https://<team>.cloudflareaccess.com`
   (**Settings**, _Team name and domain_; the exact place varies between
   dashboard versions).
3. **Settings → Authentication → Login methods**: **One-time PIN** is there
   by default.

## Step 8 — Create the Access application

1. **Access → Applications → Add an application → Self-hosted**.
2. Name `Shy Safari`, **session duration** `1 month`, **application domain**
   `safari` + `example.org`.
3. Policy: **Allow**, include **Emails** (each teacher) or **Emails ending
   in** `@your-school.org`.
4. Save, reopen it and copy its **Application Audience (AUD) Tag**.

## Step 9 — Turn sync on

In **`wrangler.sync.local.jsonc`**:

```jsonc
"vars": {
  "ACCESS_TEAM_DOMAIN": "https://<team>.cloudflareaccess.com",
  "ACCESS_AUD": "<AUD tag from step 8>",
},
```

Then deploy again: `bunx wrangler deploy -c wrangler.sync.local.jsonc`. These
values aren't secret, and they stay on your computer in the ignored file.

## Step 10 — Check

1. **Sign-in**: open the site in a **private window**; the Cloudflare page
   appears; an allowed address gets a code and reaches the app.
2. **Sync is on**: press **Start**, open the class menu (top left) → **Edit
   classes**: a **"Saved on your school's server"** section shows _Signed in
   as …_.
3. **Two computers**: create a named class on one and press **Save now**;
   sign in on the other with the same address: the class appears (the page
   reloads once).
4. Sign-in logs: **Zero Trust → Logs → Access**.

## Updating

```sh
git pull && bun install
PUBLIC_SITE_URL=https://safari.example.org bun run build
bunx wrangler d1 migrations apply shy-safari --remote -c wrangler.sync.local.jsonc   # if there are new migrations
bunx wrangler deploy -c wrangler.sync.local.jsonc
```

## Administering

- Add or remove teachers in the Access policy (**Revoke existing tokens** to
  apply a removal at once).
- List synced teachers:
  `bunx wrangler d1 execute shy-safari --remote -c wrangler.sync.local.jsonc --command "SELECT email, revision, updated_at, size FROM backups"`
- Delete a teacher's data:
  `… --command "DELETE FROM backup_chunks WHERE email = 'x@y'; DELETE FROM backups WHERE email = 'x@y';"`
- D1 Time Travel keeps 7 days of history on the free plan
  (`bunx wrangler d1 time-travel --help`).

## Troubleshooting

| Symptom                                    | Cause and fix                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| No "Saved on your school's server" section | Sync is off: a var is empty, or you deployed `wrangler.jsonc`. `/api/me` answering `503` means missing vars. |
| `/api/me` answers `401` while signed in    | Team domain or AUD tag doesn't match the Access application (no trailing `/` on the team domain).            |
| "Your sign-in has expired"                 | Reload and sign in again; nothing is lost.                                                                   |
| "Can't reach the server"                   | Temporary; the app retries, classes stay on the computer.                                                    |
| "Which classes should we keep?"            | Both computers changed the same thing since the last save; everything else was merged automatically.         |
| Custom domain won't attach                 | A `safari` DNS record already exists.                                                                        |
| `wrangler deploy` fails on `database_id`   | Step 2's id wasn't copied into `wrangler.sync.local.jsonc`.                                                  |

Static-only hosting, without sync: [hosting.md](hosting.md).
