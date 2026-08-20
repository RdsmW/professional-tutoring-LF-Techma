import { readFileSync } from "node:fs";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    await sql.unsafe(readFileSync("drizzle/0024_ay_billing_phase2.sql", "utf8"));
    console.log("Academic Year billing Phase 2 schema applied");
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});