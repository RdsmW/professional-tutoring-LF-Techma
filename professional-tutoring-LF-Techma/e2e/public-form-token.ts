import { createHmac } from "node:crypto";
import postgres from "postgres";

export async function academicYearPublicFormTokenForTest() {
  const databaseUrl = process.env.DATABASE_URL;
  const secret = process.env.SESSION_SECRET ?? process.env.CLERK_SECRET_KEY;
  if (!databaseUrl || !secret) {
    throw new Error("DATABASE_URL and a public-form signing secret are required for registration API tests.");
  }

  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    const [version] = await sql`
      SELECT versions.id
      FROM public_form_versions AS versions
      INNER JOIN public_form_definitions AS definitions
        ON definitions.id = versions.definition_id
      WHERE definitions.form_key = 'academic_year_tutoring'
        AND versions.status = 'published'
      ORDER BY versions.version_number DESC
      LIMIT 1
    `;
    if (!version?.id) throw new Error("Academic Year test fixture has no published public-form version.");

    const payload = Buffer.from(
      JSON.stringify({ formId: "academic_year_tutoring", versionId: version.id, issuedAt: Date.now() }),
    ).toString("base64url");
    const signature = createHmac("sha256", secret).update(payload).digest("base64url");
    return `${payload}.${signature}`;
  } finally {
    await sql.end({ timeout: 5 });
  }
}