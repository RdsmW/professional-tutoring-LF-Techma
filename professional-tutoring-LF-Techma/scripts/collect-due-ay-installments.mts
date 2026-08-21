import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { collectDuePayments } = await import("@/lib/stripe/collect-due-payments");
  console.log(await collectDuePayments());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});