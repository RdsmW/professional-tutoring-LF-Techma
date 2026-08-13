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

const client = connectionString
  ? postgres(connectionString, {
      prepare: false,
      max: 10,
      connect_timeout: 5,
    })
  : null;

export const db = client ? drizzle(client, { schema }) : null;

export function requireDb() {
  if (!db) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return db;
}
