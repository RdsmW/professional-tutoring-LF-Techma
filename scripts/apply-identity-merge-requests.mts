import postgres from "postgres";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const sql = postgres(url, { max: 1, prepare: false });
  await sql.unsafe(readFileSync("drizzle/0004_identity_merge_requests.sql", "utf8"));
  await sql.end();
  console.log("identity_merge_requests table applied");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
