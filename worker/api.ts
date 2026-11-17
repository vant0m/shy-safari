/**
 * The sync API, under `/api/` (docs/adr/0015-sync-through-cloudflare.md):
 *
 * - `GET /api/me` — who is signed in, which also tells the app sync is on;
 * - `GET /api/revision` — the record's revision (0: none yet), without it;
 * - `GET /api/backup` — the teacher's record (204 if there is none yet);
 * - `PUT /api/backup` — save it, if it still builds on `X-Base-Revision`.
 *
 * Kept apart from the Worker's entry so it can be tested with an in-memory
 * store and a test key.
 */

import {
  BASE_REVISION_HEADER,
  MAX_SYNC_BYTES,
  REVISION_HEADER,
  UPDATED_AT_HEADER,
  WRITE_HEADER,
} from "../src/lib/sync/protocol";
import type { BackupStore } from "./store";

export interface ApiContext {
  /** The verified teacher, or null. */
  identify(request: Request): Promise<string | null>;
  /** Null when sync isn't configured on this copy: answer 503. */
  store: BackupStore | null;
}

const NO_STORE = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...NO_STORE,
      ...headers,
    },
  });
}

export async function handleApi(
  request: Request,
  { identify, store }: ApiContext,
): Promise<Response> {
  if (!store) return json({ error: "sync is not configured" }, 503);
  const email = await identify(request);
  if (!email) return json({ error: "not signed in" }, 401);

  const { pathname } = new URL(request.url);

  if (pathname === "/api/me" && request.method === "GET") {
    return json({ email });
  }

  if (pathname === "/api/revision" && request.method === "GET") {
    return json({ revision: await store.revision(email) });
  }

  if (pathname === "/api/backup" && request.method === "GET") {
    const record = await store.get(email);
    if (!record) {
      return new Response(null, {
        status: 204,
        headers: { ...NO_STORE, [REVISION_HEADER]: "0" },
      });
    }
    return new Response(record.data, {
      headers: {
        "Content-Type": "application/octet-stream",
        ...NO_STORE,
        [REVISION_HEADER]: String(record.revision),
        [UPDATED_AT_HEADER]: record.updatedAt,
      },
    });
  }

  if (pathname === "/api/backup" && request.method === "PUT") {
    if (request.headers.get(WRITE_HEADER) !== "1") {
      return json({ error: "missing header" }, 403);
    }
    const base = Number(request.headers.get(BASE_REVISION_HEADER));
    if (!Number.isInteger(base) || base < 0) {
      return json({ error: "bad base revision" }, 400);
    }
    const declared = Number(request.headers.get("Content-Length") ?? 0);
    if (declared > MAX_SYNC_BYTES) return json({ error: "too large" }, 413);
    const data = new Uint8Array(await request.arrayBuffer());
    if (data.length === 0) return json({ error: "empty" }, 400);
    if (data.length > MAX_SYNC_BYTES) return json({ error: "too large" }, 413);

    const result = await store.save(email, base, data);
    if (!result.ok) return json({ revision: result.revision }, 409);
    return json({ revision: result.revision, updatedAt: result.updatedAt });
  }

  return json({ error: "not found" }, 404);
}
