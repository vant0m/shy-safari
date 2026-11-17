/**
 * The sync Worker (`wrangler.sync.jsonc`). It runs only for `/api/*`
 * (`run_worker_first`); every other request is served straight from the
 * built site. See docs/adr/0015-sync-through-cloudflare.md.
 */

import { verifyAccessToken, fetchTeamKeys } from "./access";
import { handleApi } from "./api";
import type { Env } from "./env";
import { d1Store } from "./store";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Who is asking, failing closed. */
export async function identify(
  request: Request,
  env: Env,
): Promise<string | null> {
  if (env.ACCESS_AUD && env.ACCESS_TEAM_DOMAIN) {
    const token = request.headers.get("Cf-Access-Jwt-Assertion");
    if (!token) return null;
    return verifyAccessToken(token, {
      teamDomain: env.ACCESS_TEAM_DOMAIN.replace(/\/+$/, ""),
      audience: env.ACCESS_AUD,
      keys: fetchTeamKeys,
    });
  }
  // Local development only: no Access configured, a dev e-mail in
  // .dev.vars, and a request to this machine. `X-Dev-User` lets a test act
  // as a second teacher.
  const { hostname } = new URL(request.url);
  if (!env.ACCESS_AUD && env.DEV_USER_EMAIL && LOCAL_HOSTS.has(hostname)) {
    const other = request.headers.get("X-Dev-User");
    return (other || env.DEV_USER_EMAIL).trim().toLowerCase();
  }
  return null;
}

/** Sync is on only with Access configured (or local dev) and a database. */
function configured(env: Env): boolean {
  if (!env.DB) return false;
  if (env.ACCESS_AUD && env.ACCESS_TEAM_DOMAIN) return true;
  return Boolean(!env.ACCESS_AUD && env.DEV_USER_EMAIL);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    return handleApi(request, {
      identify: (req) => identify(req, env),
      store: configured(env) && env.DB ? d1Store(env.DB) : null,
    });
  },
};
