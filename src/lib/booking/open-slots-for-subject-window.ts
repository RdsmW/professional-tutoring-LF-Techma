import { and, eq, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { availabilitySlots, subjects, tutorSubjects, tutors } from "@/lib/db/schema";
import { catalogSubjectToDbCode } from "@/lib/booking/subject-map";
import { isValidOptionId } from "@/lib/forms/options";

export type OpenTutorRow = {
  id: string;
  displayName: string;
  notes: string | null;
  openSlots: number;
};

export type OpenSlotRow = {
  id: string;
  tutorId: string;
  label: string | null;
  dayOfWeek: number;
  startTimeLocal: string;
  endTimeLocal: string;
  openSeats: number;
  capacitySeats: number;
  bookedSeats: number;
  heldSeats: number;
  scheduleWindowId: string | null;
};

const OPEN_SEAT_PREDICATE = sql`${availabilitySlots.bookedSeats} + ${availabilitySlots.heldSeats} < ${availabilitySlots.capacitySeats}`;

export async function resolveCatalogSubjectRow(subjectCode: string) {
  if (!isValidOptionId("ACADEMIC_SUBJECTS", subjectCode)) return null;
  const database = requireDb();
  const dbCode = catalogSubjectToDbCode(subjectCode);
  const [subject] = await database
    .select({
      id: subjects.id,
      code: subjects.code,
      name: subjects.name,
    })
    .from(subjects)
    .where(eq(subjects.code, dbCode))
    .limit(1);
  return subject ?? null;
}

export async function listOpenTutorsForSubjectWindow(input: {
  subjectCode: string;
  windowId: string;
}): Promise<OpenTutorRow[]> {
  const subject = await resolveCatalogSubjectRow(input.subjectCode);
  if (!subject) return [];

  const database = requireDb();
  const tutorRows = await database
    .select({
      id: tutors.id,
      displayName: tutors.displayName,
      notes: tutors.notes,
    })
    .from(tutors)
    .innerJoin(tutorSubjects, eq(tutorSubjects.tutorId, tutors.id))
    .where(and(eq(tutors.active, true), eq(tutorSubjects.subjectId, subject.id)));

  const uniqueTutors = new Map(tutorRows.map((row) => [row.id, row]));
  const matched: OpenTutorRow[] = [];

  for (const tutor of uniqueTutors.values()) {
    const openSlotRows = await database
      .select({ id: availabilitySlots.id })
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.tutorId, tutor.id),
          eq(availabilitySlots.active, true),
          eq(availabilitySlots.scheduleWindowId, input.windowId),
          OPEN_SEAT_PREDICATE,
        ),
      );

    if (openSlotRows.length > 0) {
      matched.push({
        id: tutor.id,
        displayName: tutor.displayName,
        notes: tutor.notes,
        openSlots: openSlotRows.length,
      });
    }
  }

  return matched;
}

export async function listOpenSlotsForTutorWindow(input: {
  tutorId: string;
  windowId: string;
}): Promise<OpenSlotRow[]> {
  const database = requireDb();
  const slotRows = await database
    .select()
    .from(availabilitySlots)
    .where(
      and(
        eq(availabilitySlots.tutorId, input.tutorId),
        eq(availabilitySlots.active, true),
        eq(availabilitySlots.scheduleWindowId, input.windowId),
        OPEN_SEAT_PREDICATE,
      ),
    );

  return slotRows.map((slot) => ({
    id: slot.id,
    tutorId: slot.tutorId,
    label: slot.label,
    dayOfWeek: slot.dayOfWeek,
    startTimeLocal: slot.startTimeLocal,
    endTimeLocal: slot.endTimeLocal,
    openSeats: slot.capacitySeats - slot.bookedSeats - slot.heldSeats,
    capacitySeats: slot.capacitySeats,
    bookedSeats: slot.bookedSeats,
    heldSeats: slot.heldSeats,
    scheduleWindowId: slot.scheduleWindowId,
  }));
}

export async function findOpenPreferredSlot(input: {
  slotId: string;
  tutorId?: string;
  windowId?: string;
}) {
  const database = requireDb();
  const conditions = [
    eq(availabilitySlots.id, input.slotId),
    eq(availabilitySlots.active, true),
    OPEN_SEAT_PREDICATE,
  ];
  if (input.tutorId) conditions.push(eq(availabilitySlots.tutorId, input.tutorId));
  if (input.windowId) conditions.push(eq(availabilitySlots.scheduleWindowId, input.windowId));

  const [slot] = await database
    .select()
    .from(availabilitySlots)
    .where(and(...conditions))
    .limit(1);

  if (!slot) return null;
  return {
    ...slot,
    openSeats: slot.capacitySeats - slot.bookedSeats - slot.heldSeats,
  };
}
