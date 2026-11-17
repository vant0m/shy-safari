/**
 * Who is asking: the e-mail in a verified Cloudflare Access token.
 *
 * Access puts a signed JWT in `Cf-Access-Jwt-Assertion` on every request it
 * lets through. It is checked here in full — RS256 signature against the
 * team's published keys, issuer, audience, expiry — because the Worker can
 * also be reached where Access does not stand in front of it (`workers.dev`,
 * preview URLs). An e-mail header on its own proves nothing.
 */

export interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
  alg?: string;
}

/** Fetches the team's public keys; injectable so tests need no network. */
export type KeySource = (teamDomain: string) => Promise<Jwk[]>;

const KEY_TTL_MS = 60 * 60 * 1000;
let cachedKeys: { team: string; keys: Jwk[]; at: number } | null = null;

export const fetchTeamKeys: KeySource = async (teamDomain) => {
  if (
    cachedKeys &&
    cachedKeys.team === teamDomain &&
    Date.now() - cachedKeys.at < KEY_TTL_MS
  ) {
    return cachedKeys.keys;
  }
  const response = await fetch(`${teamDomain}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error(`certs: ${response.status}`);
  const { keys } = (await response.json()) as { keys: Jwk[] };
  cachedKeys = { team: teamDomain, keys, at: Date.now() };
  return keys;
};

function base64UrlToBytes(part: string): Uint8Array<ArrayBuffer> {
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function decodeJson(part: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(part)));
}

export interface VerifyOptions {
  teamDomain: string;
  audience: string;
  keys: KeySource;
  now?: number;
}

/** The verified e-mail, lower-cased, or null if the token can't be trusted. */
export async function verifyAccessToken(
  token: string,
  { teamDomain, audience, keys, now = Date.now() }: VerifyOptions,
): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = decodeJson(parts[0]);
    const payload = decodeJson(parts[1]);
    if (header.alg !== "RS256" || typeof header.kid !== "string") return null;

    const jwk = (await keys(teamDomain)).find((key) => key.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      base64UrlToBytes(parts[2]),
      signed,
    );
    if (!valid) return null;

    const issuer = teamDomain.replace(/\/+$/, "");
    if (payload.iss !== issuer) return null;
    const aud = payload.aud;
    const audiences = Array.isArray(aud) ? aud : [aud];
    if (!audiences.includes(audience)) return null;
    const seconds = now / 1000;
    if (typeof payload.exp !== "number" || payload.exp <= seconds) return null;
    if (typeof payload.nbf === "number" && payload.nbf > seconds + 60) {
      return null;
    }
    if (typeof payload.email !== "string" || !payload.email.includes("@")) {
      return null;
    }
    return payload.email.trim().toLowerCase();
  } catch {
    return null;
  }
}
