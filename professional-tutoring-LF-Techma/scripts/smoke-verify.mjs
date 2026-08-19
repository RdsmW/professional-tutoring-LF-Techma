import postgres from "postgres";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadEnvLocal();

const base = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function checkHttp(name, path, { method = "GET", expectStatus } = {}) {
  const started = Date.now();
  try {
    const res = await fetch(`${base}${path}`, { method, redirect: "manual" });
    const ms = Date.now() - started;
    const bodyText = await res.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = bodyText.slice(0, 120);
    }
    const statusOk = expectStatus
      ? Array.isArray(expectStatus)
        ? expectStatus.includes(res.status)
        : res.status === expectStatus
      : res.status < 500;
    record(
      name,
      statusOk,
      `status=${res.status} ${ms}ms body=${typeof body === "string" ? body : JSON.stringify(body)}`,
    );
    return { res, body, ms };
  } catch (error) {
    record(name, false, String(error.message || error));
    return null;
  }
}

async function checkDb() {
  const cs = process.env.DATABASE_URL;
  if (!cs) {
    record("db.connect", false, "DATABASE_URL missing");
    return;
  }
  const started = Date.now();
  const sql = postgres(cs, { prepare: false, max: 1, connect_timeout: 5 });
  try {
    const rows = await sql`
      select
        (select count(*)::int from households) as households,
        (select count(*)::int from availability_slots where active = true) as active_slots,
        (select coalesce(sum(greatest(capacity_seats - held_seats - booked_seats, 0)), 0)::int
           from availability_slots where active = true) as tutor_openings,
        (select count(*)::int from households where status = 'pending') as pending_households
    `;
    const ms = Date.now() - started;
    record(
      "db.connect",
      true,
      `${ms}ms openings=${rows[0].tutor_openings} pending=${rows[0].pending_households} slots=${rows[0].active_slots}`,
    );
    record("db.timeout_config", true, "connect_timeout=5 prepare=false");
  } catch (error) {
    record("db.connect", false, String(error.message || error));
  } finally {
    await sql.end({ timeout: 1 });
  }
}

async function checkSourceContracts() {
  const files = {
    "src/lib/db/index.ts": ["connect_timeout: 5", "prepare: false"],
    "src/components/staff-shell.tsx": ["BootstrapSession"],
    "src/components/family-shell.tsx": ["BootstrapSession", "family-mode"],
    "src/app/staff/page.tsx": [
      "hero-panel",
      "Families still setting up",
      "Sessions this week",
      "Family requests",
      "Recently added",
      "loadError",
      "StaffHomeHeroActions",
      "dashboard-main-row",
      "metric-strip",
    ],
    "src/components/staff-home-create-menu.tsx": [
      "New family",
      "New tutor",
      "from=dashboard",
    ],
    "src/app/api/bootstrap/route.ts": ["ensureStaffProfile", "ensureFamilyGuardian", "ok: false"],
  };

  for (const [file, needles] of Object.entries(files)) {
    const text = readFileSync(resolve(process.cwd(), file), "utf8");
    const missing = needles.filter((n) => !text.includes(n));
    record(`source.${file}`, missing.length === 0, missing.length ? `missing: ${missing.join(", ")}` : "ok");
  }
}

await checkSourceContracts();
await checkDb();
await checkHttp("http.health", "/api/health", { expectStatus: 200 });
const bootstrap = await checkHttp("http.bootstrap.unauth", "/api/bootstrap", {
  method: "POST",
  expectStatus: 401,
});
if (bootstrap?.body && typeof bootstrap.body === "object") {
  record(
    "http.bootstrap.unauth.json",
    bootstrap.body.ok === false,
    JSON.stringify(bootstrap.body),
  );
}
await checkHttp("http.sign-in", "/sign-in", { expectStatus: 200 });
await checkHttp("http.staff.protected", "/staff", { expectStatus: [302, 303, 307, 308, 401, 404] });

const failed = results.filter((r) => !r.ok);
console.log("---");
console.log(`Summary: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
