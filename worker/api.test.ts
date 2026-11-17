import { describe, expect, it } from "bun:test";
import {
  BASE_REVISION_HEADER,
  MAX_SYNC_BYTES,
  REVISION_HEADER,
  WRITE_HEADER,
} from "../src/lib/sync/protocol";
import { handleApi, type ApiContext } from "./api";
import { identify } from "./index";
import type { Env } from "./env";
import type { BackupStore, StoredRecord } from "./store";

/** The store's rules, in memory. */
function memoryStore(): BackupStore {
  const records = new Map<string, StoredRecord>();
  return {
    async get(email) {
      return records.get(email) ?? null;
    },
    async revision(email) {
      return records.get(email)?.revision ?? 0;
    },
    async save(email, base, data) {
      const current = records.get(email)?.revision ?? 0;
      if (current !== base) return { ok: false, revision: current };
      const updatedAt = new Date().toISOString();
      records.set(email, { revision: base + 1, updatedAt, data });
      return { ok: true, revision: base + 1, updatedAt };
    },
  };
}

function context(store: BackupStore | null = memoryStore()): ApiContext {
  return {
    store,
    identify: async (request) => request.headers.get("X-Test-User"),
  };
}

const URL_BASE = "https://safari.example.org";

function put(base: number, body: Uint8Array, user = "a@school.org") {
  return new Request(`${URL_BASE}/api/backup`, {
    method: "PUT",
    headers: {
      "X-Test-User": user,
      [WRITE_HEADER]: "1",
      [BASE_REVISION_HEADER]: String(base),
    },
    body,
  });
}

function get(path: string, user: string | null = "a@school.org") {
  return new Request(`${URL_BASE}${path}`, {
    headers: user ? { "X-Test-User": user } : {},
  });
}

const bytes = (...values: number[]) => new Uint8Array(values);

describe("the sync API", () => {
  it("answers 503 when sync isn't configured", async () => {
    const response = await handleApi(get("/api/me"), context(null));
    expect(response.status).toBe(503);
  });

  it("answers 401 to anyone not signed in", async () => {
    const response = await handleApi(get("/api/me", null), context());
    expect(response.status).toBe(401);
  });

  it("says who is signed in", async () => {
    const response = await handleApi(get("/api/me"), context());
    expect(await response.json()).toEqual({ email: "a@school.org" });
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("has nothing for a new teacher, then gives back what was saved", async () => {
    const ctx = context();
    const empty = await handleApi(get("/api/backup"), ctx);
    expect(empty.status).toBe(204);
    expect(empty.headers.get(REVISION_HEADER)).toBe("0");

    const saved = await handleApi(put(0, bytes(1, 2, 3)), ctx);
    expect(await saved.json()).toMatchObject({ revision: 1 });

    const back = await handleApi(get("/api/backup"), ctx);
    expect(back.headers.get(REVISION_HEADER)).toBe("1");
    expect(new Uint8Array(await back.arrayBuffer())).toEqual(bytes(1, 2, 3));
  });

  it("refuses a save built on an old revision, saying where it is", async () => {
    const ctx = context();
    await handleApi(put(0, bytes(1)), ctx);
    await handleApi(put(1, bytes(2)), ctx);
    const late = await handleApi(put(1, bytes(3)), ctx);
    expect(late.status).toBe(409);
    expect(await late.json()).toEqual({ revision: 2 });
    const second = await handleApi(put(0, bytes(4)), ctx);
    expect(second.status).toBe(409);
  });

  it("keeps each teacher's record apart", async () => {
    const ctx = context();
    await handleApi(put(0, bytes(1), "a@school.org"), ctx);
    const other = await handleApi(get("/api/backup", "b@school.org"), ctx);
    expect(other.status).toBe(204);
  });

  it("refuses a save without its header, which a cross-site form can't send", async () => {
    const request = new Request(`${URL_BASE}/api/backup`, {
      method: "PUT",
      headers: { "X-Test-User": "a@school.org", [BASE_REVISION_HEADER]: "0" },
      body: bytes(1),
    });
    expect((await handleApi(request, context())).status).toBe(403);
  });

  it("refuses an empty save, a bad revision and anything too large", async () => {
    const ctx = context();
    expect((await handleApi(put(0, new Uint8Array()), ctx)).status).toBe(400);
    expect((await handleApi(put(-1, bytes(1)), ctx)).status).toBe(400);
    const huge = new Uint8Array(MAX_SYNC_BYTES + 1);
    expect((await handleApi(put(0, huge), ctx)).status).toBe(413);
  });

  it("gives the revision without the record", async () => {
    const ctx = context();
    const before = await handleApi(get("/api/revision"), ctx);
    expect(await before.json()).toEqual({ revision: 0 });
    await handleApi(put(0, bytes(1)), ctx);
    const after = await handleApi(get("/api/revision"), ctx);
    expect(await after.json()).toEqual({ revision: 1 });
  });

  it("answers 404 for anything else", async () => {
    expect((await handleApi(get("/api/other"), context())).status).toBe(404);
  });
});

describe("who is asking", () => {
  const assets = { fetch: async () => new Response("") };

  it("never trusts a bare e-mail header when Access is configured", async () => {
    const env: Env = {
      ASSETS: assets,
      ACCESS_AUD: "aud",
      ACCESS_TEAM_DOMAIN: "https://school.cloudflareaccess.com",
    };
    const request = new Request(`${URL_BASE}/api/me`, {
      headers: { "Cf-Access-Authenticated-User-Email": "a@school.org" },
    });
    expect(await identify(request, env)).toBeNull();
  });

  it("uses the dev e-mail only on this machine, and only without Access", async () => {
    const env: Env = { ASSETS: assets, DEV_USER_EMAIL: "Dev@Local" };
    expect(
      await identify(new Request("http://localhost:8787/api/me"), env),
    ).toBe("dev@local");
    expect(await identify(new Request(`${URL_BASE}/api/me`), env)).toBeNull();
    expect(
      await identify(new Request("http://localhost:8787/api/me"), {
        ...env,
        ACCESS_AUD: "aud",
      }),
    ).toBeNull();
  });
});
