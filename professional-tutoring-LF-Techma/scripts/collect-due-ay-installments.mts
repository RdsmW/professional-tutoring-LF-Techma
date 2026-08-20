import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { collectDueAcademicYearInstallments } = await import("@/lib/stripe/collect-due-ay-installments");
  console.log(await collectDueAcademicYearInstallments());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});