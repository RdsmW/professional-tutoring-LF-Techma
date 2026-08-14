import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[db] DATABASE_URL is not set. Server database queries will fail until it is configured.",
  );
} else if (
  process.env.NODE_ENV !== "production" &&
  /db\.[^/]+:5432/.test(connectionString) &&
  !/pooler/i.test(connectionString)
) {
  console.warn(
    "[db] DATABASE_URL looks like a direct Supabase :5432 host. Prefer the pooler (:6543) for Next.js — see .env.local.example.",
  );
}

type PgClient = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as {
  __ptPgClient?: PgClient | null;
};

function createClient(url: string): PgClient {
  // Keep the pool tiny: Supabase session pooler caps around 15 clients.
  // Next.js HMR must reuse one client via globalThis or connections leak.
  return postgres(url, {
    prepare: false,
    max: 3,
    idle_timeout: 20,
    max_lifetime: 60 * 5,
    connect_timeout: 10,
  });
}

const client: PgClient | null = connectionString
  ? (globalForDb.__ptPgClient ?? createClient(connectionString))
  : null;

if (client && process.env.NODE_ENV !== "production") {
  globalForDb.__ptPgClient = client;
}

export const db = client ? drizzle(client, { schema }) : null;

export function requireDb() {
  if (!db) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return db;
}
