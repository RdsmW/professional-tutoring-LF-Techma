import { readFileSync } from "fs";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const sql = postgres(url, { max: 1 });
  const query = readFileSync("drizzle/0001_support_cases.sql", "utf8");
  await sql.unsafe(query);
  await sql.end();
  console.log("support schema applied");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
