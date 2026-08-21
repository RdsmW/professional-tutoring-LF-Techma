import { and, desc, eq, sql } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "node:crypto";
import { requireDb, withDbRetry } from "@/lib/db";
import {
  publicFormAuditEvents,
  publicFormDefinitions,
  publicFormVersions,
  type staffProfiles,
} from "@/lib/db/schema";
import { createDefaultPublicFormContent, parsePublicFormContent, type PublicFormContent } from "@/lib/forms/public-form-schema";
import type { FormId } from "@/lib/forms/types";
import { PUBLIC_FORM_CATALOG } from "@/lib/staff/public-form-catalog";

export type PublicFormPermission = "preview" | "edit" | "publish" | "archive" | "restore";
type StaffRole = typeof staffProfiles.$inferSelect["role"];

const PERMISSIONS: Record<StaffRole, PublicFormPermission[]> = {
  admin: ["preview", "edit", "publish", "archive", "restore"],
  scheduler: ["preview", "edit"],
  finance: ["preview"],
  support: ["preview"],
};

export function canManagePublicForm(role: StaffRole, permission: PublicFormPermission) {
  return PERMISSIONS[role].includes(permission);
}

export function isFormId(value: string): value is FormId {
  return PUBLIC_FORM_CATALOG.some((form) => form.id === value);
}

function catalog(formId: FormId) {
  const item = PUBLIC_FORM_CATALOG.find((form) => form.id === formId);
  if (!item) throw new Error("Unsupported form.");
  return item;
}

async function ensureDefinition(formId: FormId) {
  const database = requireDb();
  const existing = await database
    .select()
    .from(publicFormDefinitions)
    .where(eq(publicFormDefinitions.formKey, formId))
    .limit(1);
  if (existing[0]) return existing[0];

  const item = catalog(formId);
  const [definition] = await database
    .insert(publicFormDefinitions)
    .values({
      formKey: formId,
      publicPath: item.publicPath,
      status: item.status === "active" ? "active" : "inactive",
      updatedAt: new Date(),
    })
    .returning();
  const initial = createDefaultPublicFormContent(formId);
  const [version] = await database
    .insert(publicFormVersions)
    .values({
      definitionId: definition.id,
      versionNumber: 1,
      status: "published",
      content: initial,
      changeReason: "Initial protected form baseline",
      publishedAt: new Date(),
    })
    .returning();
  await database.insert(publicFormAuditEvents).values({
    definitionId: definition.id,
    versionId: version.id,
    action: "seeded",
    reason: "Initial protected form baseline",
  });
  return definition;
}

function shapeVersion(row: typeof publicFormVersions.$inferSelect) {
  return {
    id: row.id,
    versionNumber: row.versionNumber,
    status: row.status,
    content: row.content as PublicFormContent,
    changeReason: row.changeReason,
    createdAt: row.createdAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
  };
}

export async function getPublicFormEditorState(formId: FormId) {
  return withDbRetry(async () => {
    const database = requireDb();
    const definition = await ensureDefinition(formId);
    const versions = await database
      .select()
      .from(publicFormVersions)
      .where(eq(publicFormVersions.definitionId, definition.id))
      .orderBy(desc(publicFormVersions.versionNumber));
    const audit = await database
      .select()
      .from(publicFormAuditEvents)
      .where(eq(publicFormAuditEvents.definitionId, definition.id))
      .orderBy(desc(publicFormAuditEvents.createdAt))
      .limit(30);
    const latestDraft = versions.find((version) => version.status === "draft") ?? null;
    const published = versions.find((version) => version.status === "published") ?? null;
    return {
      form: { id: formId, publicPath: definition.publicPath, status: definition.status },
      draft: latestDraft ? shapeVersion(latestDraft) : null,
      published: published ? shapeVersion(published) : null,
      versions: versions.map(shapeVersion),
      audit: audit.map((event) => ({
        id: event.id,
        action: event.action,
        reason: event.reason,
        createdAt: event.createdAt.toISOString(),
        versionId: event.versionId,
      })),
    };
  });
}

export async function savePublicFormDraft(input: {
  formId: FormId;
  content: unknown;
  expectedVersionId: string | null;
  staffId: string;
  staffName: string;
}) {
  const parsed = parsePublicFormContent(input.formId, input.content);
  if (!parsed.content) return { ok: false as const, issues: parsed.issues };
  return withDbRetry(async () => {
    const database = requireDb();
    const definition = await ensureDefinition(input.formId);
    const now = new Date();
    return database.transaction(async (tx) => {
      // Serialize writers for this definition. The expected id check happens
      // after the lock, so a concurrent editor gets a reliable 409 instead of
      // silently replacing another person's draft.
      await tx.execute(sql`select 1 from ${publicFormDefinitions} where ${publicFormDefinitions.id} = ${definition.id} for update`);
      const existingDrafts = await tx
        .select()
        .from(publicFormVersions)
        .where(and(eq(publicFormVersions.definitionId, definition.id), eq(publicFormVersions.status, "draft")));
      const activeDraftId = existingDrafts[0]?.id ?? null;
      if (activeDraftId !== input.expectedVersionId) {
        return {
          ok: false as const,
          conflict: true as const,
          issues: [{ path: "form", message: "Another staff member updated this draft. Reload before saving." }],
        };
      }
      for (const draft of existingDrafts) {
        await tx
          .update(publicFormVersions)
          .set({ status: "retired", retiredAt: now })
          .where(eq(publicFormVersions.id, draft.id));
      }
      const [latestVersion] = await tx
        .select({ versionNumber: publicFormVersions.versionNumber })
        .from(publicFormVersions)
        .where(eq(publicFormVersions.definitionId, definition.id))
        .orderBy(desc(publicFormVersions.versionNumber))
        .limit(1);
      const [version] = await tx
        .insert(publicFormVersions)
        .values({
          definitionId: definition.id,
          versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
          status: "draft",
          content: parsed.content,
          createdByStaffId: input.staffId,
        })
        .returning();
      await tx.update(publicFormDefinitions).set({ updatedAt: now }).where(eq(publicFormDefinitions.id, definition.id));
      await tx.insert(publicFormAuditEvents).values({
        definitionId: definition.id,
        versionId: version.id,
        action: "draft_saved",
        staffId: input.staffId,
        staffName: input.staffName,
      });
      return { ok: true as const, version: shapeVersion(version) };
    });
  });
}

export async function publishPublicFormVersion(input: {
  formId: FormId;
  versionId: string;
  reason: string;
  staffId: string;
  staffName: string;
}) {
  const reason = input.reason.trim();
  if (!reason) return { ok: false as const, issues: [{ path: "reason", message: "A publish reason is required." }] };
  return withDbRetry(async () => {
    const database = requireDb();
    const definition = await ensureDefinition(input.formId);
    const [version] = await database
      .select()
      .from(publicFormVersions)
      .where(and(eq(publicFormVersions.id, input.versionId), eq(publicFormVersions.definitionId, definition.id)))
      .limit(1);
    if (!version || version.status !== "draft") return { ok: false as const, issues: [{ path: "form", message: "That draft is no longer available." }] };
    const parsed = parsePublicFormContent(input.formId, version.content);
    if (!parsed.content) return { ok: false as const, issues: parsed.issues };
    const now = new Date();
    return database.transaction(async (tx) => {
      await tx.execute(sql`select 1 from ${publicFormDefinitions} where ${publicFormDefinitions.id} = ${definition.id} for update`);
      const [lockedVersion] = await tx
        .select()
        .from(publicFormVersions)
        .where(and(eq(publicFormVersions.id, input.versionId), eq(publicFormVersions.definitionId, definition.id)))
        .limit(1);
      if (!lockedVersion || lockedVersion.status !== "draft") {
        return { ok: false as const, issues: [{ path: "form", message: "That draft is no longer available." }] };
      }
      await tx
        .update(publicFormVersions)
        .set({ status: "retired", retiredAt: now })
        .where(and(eq(publicFormVersions.definitionId, definition.id), eq(publicFormVersions.status, "published")));
      const [published] = await tx
        .update(publicFormVersions)
        .set({ status: "published", changeReason: reason, publishedAt: now })
        .where(eq(publicFormVersions.id, lockedVersion.id))
        .returning();
      await tx.update(publicFormDefinitions).set({ updatedAt: now }).where(eq(publicFormDefinitions.id, definition.id));
      await tx.insert(publicFormAuditEvents).values({
        definitionId: definition.id,
        versionId: lockedVersion.id,
        action: "published",
        reason,
        staffId: input.staffId,
        staffName: input.staffName,
      });
      return { ok: true as const, version: shapeVersion(published) };
    });
  });
}

export async function discardPublicFormDraft(input: { formId: FormId; versionId: string; staffId: string; staffName: string }) {
  return withDbRetry(async () => {
    const database = requireDb();
    const definition = await ensureDefinition(input.formId);
    const now = new Date();
    return database.transaction(async (tx) => {
      await tx.execute(sql`select 1 from ${publicFormDefinitions} where ${publicFormDefinitions.id} = ${definition.id} for update`);
      const [discarded] = await tx
        .update(publicFormVersions)
        .set({ status: "retired", retiredAt: now })
        .where(and(eq(publicFormVersions.id, input.versionId), eq(publicFormVersions.definitionId, definition.id), eq(publicFormVersions.status, "draft")))
        .returning();
      if (!discarded) return { ok: false as const, issues: [{ path: "form", message: "That draft is no longer available." }] };
      await tx.insert(publicFormAuditEvents).values({
        definitionId: definition.id,
        versionId: discarded.id,
        action: "discarded",
        staffId: input.staffId,
        staffName: input.staffName,
      });
      return { ok: true as const };
    });
  });
}

export async function rollbackPublicFormVersion(input: {
  formId: FormId;
  sourceVersionId: string;
  reason: string;
  staffId: string;
  staffName: string;
}) {
  const reason = input.reason.trim();
  if (!reason) return { ok: false as const, issues: [{ path: "reason", message: "A rollback reason is required." }] };
  return withDbRetry(async () => {
    const database = requireDb();
    const definition = await ensureDefinition(input.formId);
    const [source] = await database
      .select()
      .from(publicFormVersions)
      .where(and(eq(publicFormVersions.id, input.sourceVersionId), eq(publicFormVersions.definitionId, definition.id)))
      .limit(1);
    if (!source || source.status === "draft") return { ok: false as const, issues: [{ path: "form", message: "Choose an earlier immutable version to restore." }] };
    const parsed = parsePublicFormContent(input.formId, source.content);
    if (!parsed.content) return { ok: false as const, issues: parsed.issues };
    const now = new Date();
    return database.transaction(async (tx) => {
      await tx.execute(sql`select 1 from ${publicFormDefinitions} where ${publicFormDefinitions.id} = ${definition.id} for update`);
      const [latestVersion] = await tx
        .select({ versionNumber: publicFormVersions.versionNumber })
        .from(publicFormVersions)
        .where(eq(publicFormVersions.definitionId, definition.id))
        .orderBy(desc(publicFormVersions.versionNumber))
        .limit(1);
      await tx
        .update(publicFormVersions)
        .set({ status: "retired", retiredAt: now })
        .where(and(eq(publicFormVersions.definitionId, definition.id), eq(publicFormVersions.status, "published")));
      const [restored] = await tx
        .insert(publicFormVersions)
        .values({
          definitionId: definition.id,
          versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
          status: "published",
          content: parsed.content,
          createdByStaffId: input.staffId,
          changeReason: reason,
          publishedAt: now,
        })
        .returning();
      await tx.update(publicFormDefinitions).set({ updatedAt: now }).where(eq(publicFormDefinitions.id, definition.id));
      await tx.insert(publicFormAuditEvents).values({
        definitionId: definition.id,
        versionId: restored.id,
        action: "restored",
        reason,
        staffId: input.staffId,
        staffName: input.staffName,
        metadata: { sourceVersionId: source.id, sourceVersionNumber: source.versionNumber },
      });
      return { ok: true as const, version: shapeVersion(restored) };
    });
  });
}

export async function getPublishedPublicForm(formId: FormId): Promise<{ content: PublicFormContent; versionId: string }> {
  return withDbRetry(async () => {
    const database = requireDb();
    const definition = await ensureDefinition(formId);

    return database.transaction(async (tx) => {
      await tx.execute(sql`select 1 from ${publicFormDefinitions} where ${publicFormDefinitions.id} = ${definition.id} for update`);
      const [published] = await tx
        .select()
        .from(publicFormVersions)
        .where(and(eq(publicFormVersions.definitionId, definition.id), eq(publicFormVersions.status, "published")))
        .orderBy(desc(publicFormVersions.versionNumber))
        .limit(1);
      const parsed = published ? parsePublicFormContent(formId, published.content) : { content: null };
      if (published && parsed.content) return { content: parsed.content, versionId: published.id };

      const [latestVersion] = await tx
        .select({ versionNumber: publicFormVersions.versionNumber })
        .from(publicFormVersions)
        .where(eq(publicFormVersions.definitionId, definition.id))
        .orderBy(desc(publicFormVersions.versionNumber))
        .limit(1);
      const content = createDefaultPublicFormContent(formId);
      const restoredFromInvalidVersion = Boolean(published);
      const replacementReason = restoredFromInvalidVersion
        ? "Replaced invalid published form with protected baseline"
        : "Restored missing public form baseline";
      if (published) {
        await tx
          .update(publicFormVersions)
          .set({ status: "retired", retiredAt: new Date() })
          .where(eq(publicFormVersions.id, published.id));
      }
      const [seeded] = await tx
        .insert(publicFormVersions)
        .values({
          definitionId: definition.id,
          versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
          status: "published",
          content,
          changeReason: replacementReason,
          publishedAt: new Date(),
        })
        .returning();
      await tx.insert(publicFormAuditEvents).values({
        definitionId: definition.id,
        versionId: seeded.id,
        action: restoredFromInvalidVersion ? "restored" : "seeded",
        reason: replacementReason,
        metadata: published
          ? { replacedVersionId: published.id, replacedVersionNumber: published.versionNumber }
          : undefined,
      });
      return { content, versionId: seeded.id };
    });
  });
}

export async function getPublishedPublicFormVersionId(formId: FormId) {
  return (await getPublishedPublicForm(formId)).versionId;
}

type IssuedVersionPayload = { formId: FormId; versionId: string; issuedAt: number };

function tokenSecret() {
  return process.env.SESSION_SECRET ?? process.env.CLERK_SECRET_KEY ?? "";
}

function sign(value: string) {
  return createHmac("sha256", tokenSecret()).update(value).digest("base64url");
}

/** Binds an in-progress registration to the validated version the family saw. */
export function issuePublicFormVersionToken(formId: FormId, versionId: string | null) {
  if (!versionId || !tokenSecret()) return null;
  const payload = Buffer.from(JSON.stringify({ formId, versionId, issuedAt: Date.now() } satisfies IssuedVersionPayload)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export async function resolveIssuedPublicFormVersionId(formId: FormId, token: string | undefined) {
  if (!token || !tokenSecret()) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  let payload: IssuedVersionPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as IssuedVersionPayload;
  } catch {
    return null;
  }
  if (payload.formId !== formId || !payload.versionId || Date.now() - payload.issuedAt > 4 * 60 * 60 * 1000) return null;
  try {
    const database = requireDb();
    const [version] = await database
      .select({ id: publicFormVersions.id })
      .from(publicFormVersions)
      .innerJoin(publicFormDefinitions, eq(publicFormVersions.definitionId, publicFormDefinitions.id))
      .where(and(eq(publicFormVersions.id, payload.versionId), eq(publicFormDefinitions.formKey, formId)))
      .limit(1);
    return version?.id ?? null;
  } catch {
    return null;
  }
}