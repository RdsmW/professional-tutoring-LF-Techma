import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config();

if (process.env.NODE_ENV === "production") {
  throw new Error("Development Academic Year availability fixtures cannot run in production.");
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed Academic Year test availability.");
}

const windows = [
  { id: "sun_1300_1500", day: 0, start: "13:00", end: "15:00", label: "Sunday 1:00-3:00pm" },
  { id: "sun_1500_1700", day: 0, start: "15:00", end: "17:00", label: "Sunday 3:00-5:00pm" },
  { id: "tue_1515_1715", day: 2, start: "15:15", end: "17:15", label: "Tuesday 3:15-5:15pm" },
  { id: "tue_1715_1915", day: 2, start: "17:15", end: "19:15", label: "Tuesday 5:15-7:15pm" },
  { id: "wed_1515_1715", day: 3, start: "15:15", end: "17:15", label: "Wednesday 3:15-5:15pm" },
  { id: "wed_1715_1915", day: 3, start: "17:15", end: "19:15", label: "Wednesday 5:15-7:15pm" },
  { id: "wed_1915_2115", day: 3, start: "19:15", end: "21:15", label: "Wednesday 7:15-9:15pm" },
  { id: "thu_1530_1730", day: 4, start: "15:30", end: "17:30", label: "Thursday 3:30-5:30pm" },
] as const;

const subjectCodes = ["math", "english", "science", "sat", "act"] as const;
const tutorEmail = "development-ay-schedule-fixture@example.invalid";
const slotPrefix = "Development Academic Year test availability — ";

const sql = postgres(databaseUrl, { max: 1, prepare: false });

try {
  const subjectRows = await sql`
    SELECT id, code
    FROM subjects
    WHERE active = true
      AND code = ANY(${subjectCodes})
  `;
  const subjectsByCode = new Map(subjectRows.map((subject) => [subject.code as string, subject.id as string]));
  const missingSubjects = subjectCodes.filter((code) => !subjectsByCode.has(code));
  if (missingSubjects.length > 0) {
    throw new Error(`Cannot create test availability because these active subjects are missing: ${missingSubjects.join(", ")}.`);
  }

  const [existingTutor] = await sql`
    SELECT id
    FROM tutors
    WHERE email = ${tutorEmail}
    LIMIT 1
  `;
  const tutorId =
    (existingTutor?.id as string | undefined) ??
    (
      await sql`
        INSERT INTO tutors (display_name, email, active, max_seats_per_slot, notes)
        VALUES (
          'Development Academic Year Test Tutor',
          ${tutorEmail},
          true,
          1,
          'Development-only availability fixture. Do not use for live scheduling.'
        )
        RETURNING id
      `
    )[0]!.id;

  for (const subjectCode of subjectCodes) {
    await sql`
      INSERT INTO tutor_subjects (tutor_id, subject_id)
      SELECT ${tutorId}::uuid, ${subjectsByCode.get(subjectCode)!}::uuid
      WHERE NOT EXISTS (
        SELECT 1
        FROM tutor_subjects
        WHERE tutor_id = ${tutorId}::uuid
          AND subject_id = ${subjectsByCode.get(subjectCode)!}::uuid
      )
    `;
  }

  for (const window of windows) {
    const label = `${slotPrefix}${window.label}`;
    await sql`
      INSERT INTO availability_slots (
        tutor_id, day_of_week, start_time_local, end_time_local,
        capacity_seats, held_seats, booked_seats, active, schedule_window_id, label
      )
      SELECT
        ${tutorId}::uuid, ${window.day}, ${window.start}, ${window.end},
        1, 0, 0, true, ${window.id}, ${label}
      WHERE NOT EXISTS (
        SELECT 1
        FROM availability_slots
        WHERE tutor_id = ${tutorId}::uuid
          AND label = ${label}
      )
    `;
  }

  console.log(`Seeded ${windows.length} Development Academic Year availability windows for tutor ${tutorId}.`);
} finally {
  await sql.end({ timeout: 5 });
}