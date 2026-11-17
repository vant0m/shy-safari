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

Wrangler may ask three questions; answer:

| Question                                                                                    | Answer                                                                      |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| _For local dev, do you want to connect to the remote resource instead of a local resource?_ | **No** (local development uses a local database)                            |
| _What binding name would you like to use?_                                                  | **`DB`** (the name the code expects)                                        |
| _Would you like Wrangler to add it on your behalf?_                                         | **No** (it would add it to `wrangler.jsonc`, the static-only configuration) |

Copy the printed `database_id` into **`wrangler.sync.local.jsonc`**,
replacing `00000000-0000-0000-0000-000000000000`.

If you answered **Yes** to the last question, Wrangler wrote the id into
`wrangler.jsonc`: copy it into `wrangler.sync.local.jsonc`, then restore
`wrangler.jsonc`:

```sh
git checkout wrangler.jsonc
```

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

The Worker is live but has no public address yet: `wrangler.sync.jsonc`
turns off the `workers.dev` address and preview URLs on purpose, since they
aren't behind the sign-in page. The site appears in step 5 on your
subdomain. Sync stays off until step 9, on purpose.

## Step 5 — Attach the subdomain

**Workers & Pages → shy-safari → Settings → Domains & Routes → Add → Custom
domain** → `safari.example.org`. Cloudflare creates the DNS record and the
certificate. Open https://safari.example.org.

## Step 6 — Close the other addresses

Nothing to do: `"workers_dev": false` and `"preview_urls": false` in
`wrangler.sync.local.jsonc` keep them off on every deploy. Just check in
**Domains & Routes** that both show as disabled. (If your local copy predates
this and Wrangler warns _"workers_dev is not in your
wrangler.sync.local.jsonc"_, add those two lines from `wrangler.sync.jsonc`.)

## Step 7 — Set up Cloudflare Zero Trust

1. **Zero Trust**: pick the **Free** plan (free up to 50 users). Cloudflare
   still asks for a payment method (card or PayPal) to turn it on; nothing is
   charged while you stay on Free (check **Settings → Account / Plan**). The
   **team name** may be suggested or set for you: any name works, it only
   appears in the sign-in page's address.
2. **Add sign-in by e-mailed code** (new accounts no longer get it by
   default): **Zero Trust → Integrations → Identity providers → Add new
   identity provider → One-time PIN**.
3. The **team domain** (`https://<team>.cloudflareaccess.com`) is easiest to
   read in step 10: it is the address of the sign-in page in the browser.

## Step 8 — Create the Access application

1. **Zero Trust → Access controls → Applications → Create new
   application**, type **Public DNS** (an app on a public hostname; some
   dashboard versions call it _Self-hosted and private → Add public
   hostname_). Not **Workers**: that type protects the Worker by name, and
   how it passes the token to the Worker isn't documented; **Public DNS** is
   the documented case.
2. Name `Shy Safari`; **Domain** `safari` + `example.org`.
3. **Access policies → Create a new policy**: **Allow**, include **Emails**
   (each teacher) or **Emails ending in** `@your-school.org`. Codes are only
   sent to addresses a policy allows.
4. Login methods for the app: tick **One-time PIN** (untick the others if you
   only want e-mailed codes).
5. **Session Duration** `1 month`, then **Create**.
6. Reopen it (**Edit**) and copy the **Application Audience (AUD) Tag** from
   **Additional settings**.

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

   The **team domain** for `ACCESS_TEAM_DOMAIN` (step 9) is the start of the
   sign-in page's address, `https://<team>.cloudflareaccess.com` (nothing
   after it). If you didn't have it yet, do point 1 to read it, fill in step
   9, then come back.

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

| Symptom                                                                             | Cause and fix                                                                                                |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| No "Saved on your school's server" section                                          | Sync is off: a var is empty, or you deployed `wrangler.jsonc`. `/api/me` answering `503` means missing vars. |
| `/api/me` answers `401` while signed in                                             | Team domain or AUD tag doesn't match the Access application (no trailing `/` on the team domain).            |
| "Your sign-in has expired"                                                          | Reload and sign in again; nothing is lost.                                                                   |
| "Can't reach the server"                                                            | Temporary; the app retries, classes stay on the computer.                                                    |
| "Which classes should we keep?"                                                     | Both computers changed the same thing since the last save; everything else was merged automatically.         |
| Custom domain won't attach                                                          | A `safari` DNS record already exists.                                                                        |
| `The database 00000000-0000-0000-0000-000000000000 could not be found [code: 7404]` | The id isn't in `wrangler.sync.local.jsonc` (often Wrangler put it in `wrangler.jsonc`). See step 2.         |
| `wrangler deploy` fails on `database_id`                                            | Step 2's id wasn't copied into `wrangler.sync.local.jsonc`.                                                  |

Static-only hosting, without sync: [hosting.md](hosting.md).
