import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { availabilitySlots, subjects, tutorSubjects, tutors } from "@/lib/db/schema";

const FIXTURE_TUTOR_ID = "00000000-0000-4000-8000-000000000025";
const FIXTURE_TUTOR_EMAIL = "academic-year-test-availability@professional-tutoring.test";

const SUBJECT_FIXTURES = [
  { code: "math", name: "Mathematics" },
  { code: "english", name: "English" },
  { code: "science", name: "Science" },
  { code: "sat", name: "SAT Preparation" },
  { code: "act", name: "ACT Preparation" },
] as const;

const WINDOW_FIXTURES = [
  { id: "sun_1300_1500", slotId: "00000000-0000-4000-8000-000000000101", dayOfWeek: 0, startTimeLocal: "13:00", endTimeLocal: "15:00" },
  { id: "sun_1500_1700", slotId: "00000000-0000-4000-8000-000000000102", dayOfWeek: 0, startTimeLocal: "15:00", endTimeLocal: "17:00" },
  { id: "tue_1515_1715", slotId: "00000000-0000-4000-8000-000000000103", dayOfWeek: 2, startTimeLocal: "15:15", endTimeLocal: "17:15" },
  { id: "tue_1715_1915", slotId: "00000000-0000-4000-8000-000000000104", dayOfWeek: 2, startTimeLocal: "17:15", endTimeLocal: "19:15" },
  { id: "wed_1515_1715", slotId: "00000000-0000-4000-8000-000000000105", dayOfWeek: 3, startTimeLocal: "15:15", endTimeLocal: "17:15" },
  { id: "wed_1715_1915", slotId: "00000000-0000-4000-8000-000000000106", dayOfWeek: 3, startTimeLocal: "17:15", endTimeLocal: "19:15" },
  { id: "wed_1915_2115", slotId: "00000000-0000-4000-8000-000000000107", dayOfWeek: 3, startTimeLocal: "19:15", endTimeLocal: "21:15" },
  { id: "thu_1530_1730", slotId: "00000000-0000-4000-8000-000000000108", dayOfWeek: 4, startTimeLocal: "15:30", endTimeLocal: "17:30" },
] as const;

/**
 * Seeds an isolated test database with slots for the public direct-scheduling
 * journey. It is deliberately opt-in and must only run from test setup, never
 * from an availability lookup or registration finalization.
 */
export async function seedNonProductionAcademicYearAvailability() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Academic Year test availability cannot be seeded in production.");
  }
  if (process.env.AY_TUTORING_TEST_AVAILABILITY !== "true") {
    throw new Error("Set AY_TUTORING_TEST_AVAILABILITY=true to seed Academic Year test availability.");
  }

  const database = requireDb();
  await database.transaction(async (tx) => {
    await tx
      .insert(tutors)
      .values({
        id: FIXTURE_TUTOR_ID,
        displayName: "Academic Year Test Tutor",
        email: FIXTURE_TUTOR_EMAIL,
        active: true,
        maxSeatsPerSlot: 25,
      })
      .onConflictDoUpdate({
        target: tutors.id,
        set: { active: true, maxSeatsPerSlot: 25, updatedAt: new Date() },
      });

    for (const subject of SUBJECT_FIXTURES) {
      await tx
        .insert(subjects)
        .values({ code: subject.code, name: subject.name, category: "test-fixture", active: true })
        .onConflictDoNothing();
    }

    for (const subject of SUBJECT_FIXTURES) {
      const [subjectRow] = await tx.select({ id: subjects.id }).from(subjects).where(eq(subjects.code, subject.code)).limit(1);
      if (!subjectRow) continue;
      await tx
        .insert(tutorSubjects)
        .values({ tutorId: FIXTURE_TUTOR_ID, subjectId: subjectRow.id, priority: 0 })
        .onConflictDoNothing();
    }

    for (const window of WINDOW_FIXTURES) {
      const [existing] = await tx
        .select({
          id: availabilitySlots.id,
          bookedSeats: availabilitySlots.bookedSeats,
          heldSeats: availabilitySlots.heldSeats,
        })
        .from(availabilitySlots)
        .where(and(eq(availabilitySlots.tutorId, FIXTURE_TUTOR_ID), eq(availabilitySlots.scheduleWindowId, window.id)))
        .limit(1);
      if (existing) {
        await tx
          .update(availabilitySlots)
          .set({
            active: true,
            capacitySeats: Math.max(25, existing.bookedSeats + existing.heldSeats + 1),
            updatedAt: new Date(),
          })
          .where(eq(availabilitySlots.id, existing.id));
        continue;
      }
      await tx.insert(availabilitySlots).values({
        id: window.slotId,
        tutorId: FIXTURE_TUTOR_ID,
        dayOfWeek: window.dayOfWeek,
        startTimeLocal: window.startTimeLocal,
        endTimeLocal: window.endTimeLocal,
        capacitySeats: 25,
        heldSeats: 0,
        bookedSeats: 0,
        active: true,
        scheduleWindowId: window.id,
        label: "Non-production Academic Year test availability",
      });
    }
  });
}

/**
 * Removes the fixture from public availability after an isolated test run
 * without deleting any booking records that exercised its slots.
 */
export async function deactivateNonProductionAcademicYearAvailability() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Academic Year test availability cannot be changed in production.");
  }
  if (process.env.AY_TUTORING_TEST_AVAILABILITY !== "true") {
    throw new Error("Set AY_TUTORING_TEST_AVAILABILITY=true to clean Academic Year test availability.");
  }

  const database = requireDb();
  await database.update(tutors).set({ active: false, updatedAt: new Date() }).where(eq(tutors.id, FIXTURE_TUTOR_ID));
}