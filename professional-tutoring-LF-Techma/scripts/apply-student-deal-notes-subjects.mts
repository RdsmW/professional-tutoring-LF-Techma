import postgres from "postgres";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const sql = postgres(url, { max: 1, prepare: false });
  await sql.unsafe(readFileSync("drizzle/0018_student_deal_notes_subjects.sql", "utf8"));
  await sql.end();
  console.log("student deal fields, subjects, and notes applied");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
