import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
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
type AppDb = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __ptPgClient?: PgClient | null;
  __ptDrizzle?: AppDb | null;
};

function errorBlob(error: unknown): string {
  if (!error || typeof error !== "object") return String(error ?? "");
  const parts: string[] = [];
  const walk = (value: unknown, depth: number) => {
    if (!value || typeof value !== "object" || depth > 3) return;
    const record = value as { code?: unknown; message?: unknown; cause?: unknown };
    if (record.code != null) parts.push(String(record.code));
    if (record.message != null) parts.push(String(record.message));
    if (record.cause) walk(record.cause, depth + 1);
  };
  walk(error, 0);
  return parts.join(" ").toLowerCase();
}

export function isDbConnectionError(error: unknown): boolean {
  const blob = errorBlob(error);
  return (
    blob.includes("econnreset") ||
    blob.includes("econnrefused") ||
    blob.includes("etimedout") ||
    blob.includes("connection terminated") ||
    blob.includes("connection closed") ||
    blob.includes("server closed the connection") ||
    blob.includes("57p01") ||
    blob.includes("57p02") ||
    blob.includes("57p03")
  );
}

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

function resetDbClient() {
  const previous = globalForDb.__ptPgClient;
  globalForDb.__ptPgClient = null;
  globalForDb.__ptDrizzle = null;
  if (previous) {
    void previous.end({ timeout: 1 }).catch(() => undefined);
  }
}

function getOrCreateDb(): AppDb | null {
  if (!connectionString) return null;

  if (globalForDb.__ptDrizzle && globalForDb.__ptPgClient) {
    return globalForDb.__ptDrizzle;
  }

  const client = createClient(connectionString);
  const database = drizzle(client, { schema });
  globalForDb.__ptPgClient = client;
  globalForDb.__ptDrizzle = database;
  return database;
}

/**
 * Drop and recreate the shared pool after connection failures (ECONNRESET, etc.).
 * Returns true when a fresh client is available.
 */
export function recoverDbClient(error?: unknown): boolean {
  if (error && !isDbConnectionError(error)) return false;
  console.warn("[db] resetting postgres pool after connection failure", error ?? "");
  resetDbClient();
  return Boolean(getOrCreateDb());
}

/**
 * Live DB handle. When DATABASE_URL is set this is a Proxy that always forwards
 * to the current pool (so recoverDbClient() takes effect without re-importing).
 */
export const db: AppDb | null = connectionString
  ? (new Proxy({} as AppDb, {
      get(_target, prop, receiver) {
        const instance = getOrCreateDb();
        if (!instance) return undefined;
        const value = Reflect.get(instance as object, prop, receiver);
        return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
      },
    }) as AppDb)
  : null;

export function requireDb() {
  const database = getOrCreateDb();
  if (!database) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return database;
}

/** Run a DB-backed operation; on connection death, reset the pool and retry once. */
export async function withDbRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!recoverDbClient(error)) throw error;
    return await operation();
  }
}
