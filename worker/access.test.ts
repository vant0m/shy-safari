import { beforeAll, describe, expect, it } from "bun:test";
import { verifyAccessToken, type Jwk } from "./access";

const TEAM = "https://school.cloudflareaccess.com";
const AUD = "aud-tag-123";
const NOW = Date.UTC(2026, 10, 17, 12);

let privateKey: CryptoKey;
let jwk: Jwk;
let otherKey: CryptoKey;

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
  return btoa(String.fromCharCode(...raw))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sign(
  payload: Record<string, unknown>,
  key = privateKey,
  header: Record<string, unknown> = { alg: "RS256", kid: "k1" },
): Promise<string> {
  const head = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(head),
  );
  return `${head}.${b64url(new Uint8Array(signature))}`;
}

const good = () => ({
  iss: TEAM,
  aud: [AUD],
  email: "Teacher@School.org",
  exp: NOW / 1000 + 600,
  iat: NOW / 1000 - 10,
});

const options = () => ({
  teamDomain: TEAM,
  audience: AUD,
  keys: async () => [jwk],
  now: NOW,
});

beforeAll(async () => {
  const pair = (await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  privateKey = pair.privateKey;
  const exported = (await crypto.subtle.exportKey(
    "jwk",
    pair.publicKey,
  )) as JsonWebKey;
  jwk = { kid: "k1", kty: "RSA", n: exported.n!, e: exported.e!, alg: "RS256" };
  const other = (await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  otherKey = other.privateKey;
});

describe("verifying an Access token", () => {
  it("accepts a good token and gives the e-mail, lower-cased", async () => {
    expect(await verifyAccessToken(await sign(good()), options())).toBe(
      "teacher@school.org",
    );
  });

  it("accepts an audience given as a string", async () => {
    const token = await sign({ ...good(), aud: AUD });
    expect(await verifyAccessToken(token, options())).toBe(
      "teacher@school.org",
    );
  });

  it("refuses another application's audience", async () => {
    const token = await sign({ ...good(), aud: ["someone-else"] });
    expect(await verifyAccessToken(token, options())).toBeNull();
  });

  it("refuses another team's issuer", async () => {
    const token = await sign({
      ...good(),
      iss: "https://evil.cloudflareaccess.com",
    });
    expect(await verifyAccessToken(token, options())).toBeNull();
  });

  it("refuses an expired token", async () => {
    const token = await sign({ ...good(), exp: NOW / 1000 - 1 });
    expect(await verifyAccessToken(token, options())).toBeNull();
  });

  it("refuses a token signed with another key", async () => {
    const token = await sign(good(), otherKey);
    expect(await verifyAccessToken(token, options())).toBeNull();
  });

  it("refuses a token whose payload was changed after signing", async () => {
    const token = await sign(good());
    const [head, , signature] = token.split(".");
    const forged = `${head}.${b64url(JSON.stringify({ ...good(), email: "head@school.org" }))}.${signature}`;
    expect(await verifyAccessToken(forged, options())).toBeNull();
  });

  it("refuses an unsigned token or an unknown key", async () => {
    const none = await sign(good(), privateKey, { alg: "none", kid: "k1" });
    expect(await verifyAccessToken(none, options())).toBeNull();
    const unknown = await sign(good(), privateKey, { alg: "RS256", kid: "k9" });
    expect(await verifyAccessToken(unknown, options())).toBeNull();
  });

  it("refuses a token without an e-mail", async () => {
    const { email: _email, ...rest } = good();
    void _email;
    expect(await verifyAccessToken(await sign(rest), options())).toBeNull();
  });

  it("refuses garbage", async () => {
    expect(await verifyAccessToken("not.a.token", options())).toBeNull();
    expect(await verifyAccessToken("", options())).toBeNull();
  });
});
