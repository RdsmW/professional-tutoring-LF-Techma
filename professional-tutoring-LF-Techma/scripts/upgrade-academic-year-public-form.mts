import { config } from "dotenv";
import postgres from "postgres";
import { createDefaultPublicFormContent, parsePublicFormContent } from "../src/lib/forms/public-form-schema";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log("DATABASE_URL is not configured; skipping Academic Year public-form compatibility update.");
  process.exit(0);
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });

try {
  await sql.begin(async (tx) => {
    const [definition] = await tx`
      SELECT id
      FROM public_form_definitions
      WHERE form_key = 'academic_year_tutoring'
      LIMIT 1
      FOR UPDATE
    `;
    if (!definition?.id) return;

    const [published] = await tx`
      SELECT id, content
      FROM public_form_versions
      WHERE definition_id = ${definition.id}::uuid
        AND status = 'published'
      ORDER BY version_number DESC
      LIMIT 1
      FOR UPDATE
    `;
    if (!published || parsePublicFormContent("academic_year_tutoring", published.content).content) return;

    const [latest] = await tx`
      SELECT COALESCE(MAX(version_number), 0)::int AS version
      FROM public_form_versions
      WHERE definition_id = ${definition.id}::uuid
    `;
    await tx`
      UPDATE public_form_versions
      SET status = 'retired', retired_at = now()
      WHERE id = ${published.id}::uuid
    `;
    const [replacement] = await tx`
      INSERT INTO public_form_versions (
        definition_id, version_number, status, content, change_reason, published_at
      )
      VALUES (
        ${definition.id}::uuid,
        ${Number(latest?.version ?? 0) + 1},
        'published',
        ${tx.json(createDefaultPublicFormContent("academic_year_tutoring"))},
        'Compatibility update: current protected form baseline',
        now()
      )
      RETURNING id
    `;
    await tx`
      INSERT INTO public_form_audit_events (definition_id, version_id, action, reason, metadata)
      VALUES (
        ${definition.id}::uuid,
        ${replacement.id}::uuid,
        'compatibility_published',
        'Compatibility update: current protected form baseline',
        jsonb_build_object('sourceVersionId', ${published.id}::uuid)
      )
    `;
    await tx`
      UPDATE public_form_definitions
      SET updated_at = now()
      WHERE id = ${definition.id}::uuid
    `;
    console.log("Published a compatible Academic Year public-form baseline.");
  });
} finally {
  await sql.end({ timeout: 5 });
}