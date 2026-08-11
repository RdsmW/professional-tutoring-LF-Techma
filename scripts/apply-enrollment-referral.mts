import postgres from "postgres";
import { readFileSync } from "fs";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const sql = postgres(url, { max: 1 });
  await sql.unsafe(readFileSync("drizzle/0002_enrollment_referral.sql", "utf8"));
  await sql.end();
  console.log("enrollment referral column applied");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
