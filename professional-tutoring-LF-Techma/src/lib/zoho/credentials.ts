import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { requireDb, withDbRetry } from "@/lib/db";
import { integrationCredentials } from "@/lib/db/schema";

const PROVIDER = "zoho_crm";
const CIPHER_VERSION = "v1";

function encryptionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET must be configured before storing Zoho credentials.");
  return createHash("sha256").update(secret).digest();
}

function encrypt(refreshToken: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(refreshToken, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [CIPHER_VERSION, iv.toString("base64url"), authTag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

function decrypt(value: string) {
  const [version, ivText, authTagText, ciphertextText, extra] = value.split(".");
  if (version !== CIPHER_VERSION || !ivText || !authTagText || !ciphertextText || extra) {
    throw new Error("Stored Zoho credential is invalid.");
  }

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(authTagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextText, "base64url")), decipher.final()]).toString("utf8");
}

/**
 * The workspace-protected SESSION_SECRET encrypts the refresh token before it
 * reaches the app database. Access tokens and authorization codes are never
 * persisted.
 */
export async function storeZohoRefreshToken(refreshToken: string) {
  const encryptedRefreshToken = encrypt(refreshToken);
  const now = new Date();
  await withDbRetry(async () => {
    const database = requireDb();
    await database
      .insert(integrationCredentials)
      .values({
        provider: PROVIDER,
        encryptedRefreshToken,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: integrationCredentials.provider,
        set: { encryptedRefreshToken, updatedAt: now },
      });
  });
}

/**
 * Prefer the encrypted credential captured by the OAuth callback. The
 * workspace's pre-existing ZOHO_REFRESH_TOKEN secret remains a safe migration
 * source until an operator completes the new authorization once.
 */
export async function getZohoRefreshToken() {
  const row = await withDbRetry(async () => {
    const database = requireDb();
    const [stored] = await database
      .select({ encryptedRefreshToken: integrationCredentials.encryptedRefreshToken })
      .from(integrationCredentials)
      .where(eq(integrationCredentials.provider, PROVIDER))
      .limit(1);
    return stored ?? null;
  });

  // A corrupt or missing encrypted credential must not silently fall back to
  // an older token. Let the caller report authorization as unavailable.
  if (row?.encryptedRefreshToken) return decrypt(row.encryptedRefreshToken);
  return null;
}

/** One-time migration path for a pre-existing workspace refresh-token secret. */
export async function migrateWorkspaceZohoRefreshToken() {
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN?.trim();
  if (!refreshToken) throw new Error("ZOHO_REFRESH_TOKEN is not configured.");
  await storeZohoRefreshToken(refreshToken);
}