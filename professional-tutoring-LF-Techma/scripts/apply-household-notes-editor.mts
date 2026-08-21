import postgres from "postgres";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const sql = postgres(url, { max: 1, prepare: false });
  await sql.unsafe(readFileSync("drizzle/0010_household_notes_editor.sql", "utf8"));
  await sql.end();
  console.log("household_notes editor columns applied");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
