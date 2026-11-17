# Access is restricted in front of the site, by Cloudflare Access

A school hosting its own copy asked for a password, with one condition:
teachers must not have to create accounts. Whoever administers the site (or
its Cloudflare account) decides who gets in.

The site is static files with no server code
([0002](0002-svg-dom-scene.md), `wrangler.jsonc`), so there are three ways
to do it:

1. **A password screen inside the app.** Anyone can read the files and skip
   it in the browser's developer tools, so it protects nothing. Rejected as
   access control. (A screen to stop students fiddling with settings would be
   a different feature with a different purpose.)
2. **HTTP basic auth in a Worker** in front of the assets: real, but one
   shared login per school that circulates, cannot be revoked per person, and
   makes every request run a script.
3. **Cloudflare Access**: a sign-in page at Cloudflare's edge before any file
   is sent. The administrator lists allowed e-mail addresses (or a whole
   domain); a teacher types their address and gets a one-time code by e-mail,
   or signs in with the school's Google or Microsoft account. No password to
   share, revocable per person, free up to 50 users, and no code in this
   repository.

**Chosen: Cloudflare Access.** The setup is documented step by step in
[docs/hosting.md](../hosting.md#restricting-access-with-cloudflare-access)
(French: [docs/fr/hebergement.md](../fr/hebergement.md)). Hosts other than
Cloudflare can use their own equivalent (basic auth on nginx, say); the app
does not need to know.

Access only decides who reaches the site. Inside it, each browser still
keeps its own Classes, as before.
