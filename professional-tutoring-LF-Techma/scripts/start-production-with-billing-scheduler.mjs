import { spawn } from "node:child_process";

const port = String(process.env.PORT || 5000);
const intervalMs = positiveInteger(process.env.BILLING_COLLECTION_INTERVAL_MS, 60 * 60 * 1000);
const healthTimeoutMs = positiveInteger(process.env.BILLING_HEALTH_TIMEOUT_MS, 120 * 1000);
const appUrl = `http://127.0.0.1:${port}`;
const collectorUrl = `${appUrl}/api/internal/billing/collect-due`;

let shuttingDown = false;
let collectionInFlight = false;
let collectionTimer;

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

const webProcess = spawn("npm", ["run", "start", "--", "-H", "0.0.0.0", "-p", port], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

webProcess.on("error", (error) => {
  console.error(`[billing-scheduler] web process failed to start: ${errorMessage(error)}`);
  process.exit(1);
});

webProcess.on("exit", (code, signal) => {
  if (shuttingDown) return;
  console.error(`[billing-scheduler] web process exited code=${code ?? "null"} signal=${signal ?? "none"}`);
  if (collectionTimer) clearInterval(collectionTimer);
  process.exit(code ?? 1);
});

async function waitForHealth() {
  const deadline = Date.now() + healthTimeoutMs;
  while (!shuttingDown && Date.now() < deadline) {
    try {
      const response = await fetch(`${appUrl}/api/health`, {
        signal: AbortSignal.timeout(5_000),
      });
      if (response.ok) {
        await response.arrayBuffer();
        return;
      }
    } catch {
      // The web process may still be starting.
    }
    await sleep(1_000);
  }
  throw new Error(`web app did not become healthy within ${healthTimeoutMs}ms`);
}

async function runCollection(trigger) {
  if (shuttingDown || collectionInFlight) {
    if (collectionInFlight) {
      console.warn(`[billing-scheduler] skipped overlapping ${trigger} run`);
    }
    return;
  }

  collectionInFlight = true;
  try {
    const response = await fetch(collectorUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-billing-job-secret": process.env.BILLING_JOB_SECRET || "",
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(120_000),
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`collector returned ${response.status}: ${body}`);
    }
    console.log(`[billing-scheduler] ${trigger} collection: ${body}`);
  } catch (error) {
    console.error(`[billing-scheduler] ${trigger} collection failed: ${errorMessage(error)}`);
  } finally {
    collectionInFlight = false;
  }
}

async function startScheduler() {
  try {
    await waitForHealth();
    console.log(`[billing-scheduler] web app healthy on ${appUrl}`);
    await runCollection("startup");
  } catch (error) {
    console.error(`[billing-scheduler] startup check failed: ${errorMessage(error)}`);
  }

  if (shuttingDown) return;
  collectionTimer = setInterval(() => {
    void runCollection("interval");
  }, intervalMs);
  console.log(`[billing-scheduler] interval configured for ${intervalMs}ms`);
}

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (collectionTimer) clearInterval(collectionTimer);
  console.log(`[billing-scheduler] received ${signal}; stopping web process`);
  webProcess.kill(signal);
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (error) => {
  console.error(`[billing-scheduler] unhandled scheduler error: ${errorMessage(error)}`);
});

void startScheduler();