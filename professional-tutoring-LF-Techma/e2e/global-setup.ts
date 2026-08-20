import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { createDefaultPublicFormContent, parsePublicFormContent } from "../src/lib/forms/public-form-schema";
import { seedNonProductionAcademicYearAvailability } from "../src/lib/booking/non-production-academic-year-availability";

export default async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    const migrationPath = path.join(process.cwd(), "drizzle", "0024_public_form_versions.sql");
    await sql.unsafe(fs.readFileSync(migrationPath, "utf8"));
    const parent2MigrationPath = path.join(process.cwd(), "drizzle", "0026_academic_year_parent2_required.sql");
    await sql.unsafe(fs.readFileSync(parent2MigrationPath, "utf8"));

    const [definition] = await sql`
      SELECT id
      FROM public_form_definitions
      WHERE form_key = 'academic_year_tutoring'
      LIMIT 1
    `;
    const definitionId =
      definition?.id ??
      (
        await sql`
          INSERT INTO public_form_definitions (form_key, public_path, status)
          VALUES ('academic_year_tutoring', '/register/academic-year-tutoring', 'active')
          RETURNING id
        `
      )[0]?.id;
    if (!definitionId) throw new Error("Unable to initialize the Academic Year public form definition.");

    const [published] = await sql`
      SELECT id, content
      FROM public_form_versions
      WHERE definition_id = ${definitionId}::uuid
        AND status = 'published'
      LIMIT 1
    `;
    if (!published || !parsePublicFormContent("academic_year_tutoring", published.content).content) {
      const [latest] = await sql`
        SELECT COALESCE(MAX(version_number), 0)::int AS version
        FROM public_form_versions
        WHERE definition_id = ${definitionId}::uuid
      `;
      if (published) {
        await sql`
          UPDATE public_form_versions
          SET status = 'retired', retired_at = now()
          WHERE id = ${published.id}::uuid
        `;
      }
      await sql`
        INSERT INTO public_form_versions (
          definition_id,
          version_number,
          status,
          content,
          change_reason,
          published_at
        )
        VALUES (
          ${definitionId}::uuid,
          ${Number(latest?.version ?? 0) + 1},
          'published',
          ${sql.json(createDefaultPublicFormContent("academic_year_tutoring"))},
          'Playwright test fixture',
          now()
        )
      `;
    }
    process.env.AY_TUTORING_TEST_AVAILABILITY = "true";
    await seedNonProductionAcademicYearAvailability();
  } finally {
    await sql.end({ timeout: 5 });
  }
}