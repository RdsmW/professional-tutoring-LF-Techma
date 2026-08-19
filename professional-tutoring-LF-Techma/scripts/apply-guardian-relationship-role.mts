import postgres from "postgres";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const sql = postgres(url, { max: 1, prepare: false });
  await sql.unsafe(readFileSync("drizzle/0012_guardian_relationship_role.sql", "utf8"));
  await sql.end();
  console.log("guardian relationship_role (parent_1 / parent_2) applied");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
