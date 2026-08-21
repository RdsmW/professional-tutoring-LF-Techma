import { migrateWorkspaceZohoRefreshToken } from "../src/lib/zoho/credentials";

async function main() {
  await migrateWorkspaceZohoRefreshToken();
  console.log("Zoho refresh token migrated into encrypted credential storage.");
}

main().catch(() => {
  console.error("Zoho refresh-token migration failed.");
  process.exitCode = 1;
});