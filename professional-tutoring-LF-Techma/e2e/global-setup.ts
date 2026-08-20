import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { createDefaultPublicFormContent } from "../src/lib/forms/public-form-schema";

export default async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    const migrationPath = path.join(process.cwd(), "drizzle", "0024_public_form_versions.sql");
    await sql.unsafe(fs.readFileSync(migrationPath, "utf8"));

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
      SELECT id
      FROM public_form_versions
      WHERE definition_id = ${definitionId}::uuid
        AND status = 'published'
      LIMIT 1
    `;
    if (!published) {
      const [latest] = await sql`
        SELECT COALESCE(MAX(version_number), 0)::int AS version
        FROM public_form_versions
        WHERE definition_id = ${definitionId}::uuid
      `;
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
  } finally {
    await sql.end({ timeout: 5 });
  }
}