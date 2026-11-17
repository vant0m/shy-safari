/**
 * The bindings and variables the sync Worker runs with (`wrangler.sync.jsonc`),
 * and just enough of the Workers types for them, so the Worker needs no extra
 * type package.
 */

export interface D1Result {
  meta: { changes: number };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  /** Runs every statement in one transaction. */
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

export interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

export interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
  /** `https://<team>.cloudflareaccess.com` */
  ACCESS_TEAM_DOMAIN?: string;
  /** The Access application's Audience (AUD) tag. */
  ACCESS_AUD?: string;
  /** Local development only (`.dev.vars`), never set in production. */
  DEV_USER_EMAIL?: string;
}
