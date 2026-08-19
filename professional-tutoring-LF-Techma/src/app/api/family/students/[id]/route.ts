import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getFamilyContext } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import { availabilitySlots, bookings, students, subjects, tutors } from "@/lib/db/schema";
import { isValidOptionId } from "@/lib/forms/options";

type RouteContext = { params: Promise<{ id: string }> };

type PatchBody = {
  preferredName?: string;
  schoolName?: string;
  gradeLabel?: string;
  graduationYear?: string | number;
  availabilityNotes?: string;
  emergencyContact?: string;
  intakeUpdate?: string;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseGraduationYear(value: string | number | undefined) {
  const year = typeof value === "number" ? value : Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isFinite(year)) return null;
  if (!isValidOptionId("GRADUATION_YEARS", String(year))) return null;
  return year;
}

function asHistory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function formatSlotLabel(row: {
  slotLabel: string | null;
  dayOfWeek: number | null;
  startTimeLocal: string | null;
  endTimeLocal: string | null;
}) {
  if (row.slotLabel?.trim()) return row.slotLabel.trim();
  const day = row.dayOfWeek != null ? DAY_NAMES[row.dayOfWeek] ?? "" : "";
  const time =
    row.startTimeLocal && row.endTimeLocal ? `${row.startTimeLocal}–${row.endTimeLocal}` : row.startTimeLocal || "";
  return [day, time].filter(Boolean).join(" · ") || "Schedule pending";
}

async function loadOwnedStudent(householdId: string, studentId: string) {
  const database = requireDb();
  const [row] = await database
    .select()
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.householdId, householdId)))
    .limit(1);
  return row ?? null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const family = await getFamilyContext();
    if (!family) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const { id } = await context.params;
    const student = await loadOwnedStudent(family.household.id, id);
    if (!student) {
      return NextResponse.json({ ok: false, error: "Student not found" }, { status: 404 });
    }

    const database = requireDb();
    const bookingRows = await database
      .select({
        id: bookings.id,
        status: bookings.status,
        createdAt: bookings.createdAt,
        tutorName: tutors.displayName,
        subjectName: subjects.name,
        slotLabel: availabilitySlots.label,
        startTimeLocal: availabilitySlots.startTimeLocal,
        endTimeLocal: availabilitySlots.endTimeLocal,
        dayOfWeek: availabilitySlots.dayOfWeek,
      })
      .from(bookings)
      .leftJoin(tutors, eq(bookings.tutorId, tutors.id))
      .leftJoin(subjects, eq(bookings.subjectId, subjects.id))
      .leftJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
      .where(and(eq(bookings.householdId, family.household.id), eq(bookings.studentId, student.id)))
      .orderBy(desc(bookings.createdAt))
      .limit(8);

    const activeBooking =
      bookingRows.find((row) => row.status === "confirmed" || row.status === "pending_staff_review") ?? null;

    const scheduleLabel = activeBooking
      ? `${formatSlotLabel(activeBooking)}${activeBooking.subjectName ? ` · ${activeBooking.subjectName}` : ""}`
      : student.availabilityNotes?.trim() || "No active schedule";

    const history = [
      ...asHistory(student.serviceHistory),
      ...bookingRows.map((row) => {
        const parts = [
          row.subjectName || "Tutoring",
          row.tutorName,
          formatSlotLabel(row),
          row.status.replaceAll("_", " "),
        ].filter(Boolean);
        return parts.join(" · ");
      }),
    ];

    if (history.length === 0) {
      history.push("Student profile created", "No services selected yet");
    }

    return NextResponse.json({
      ok: true,
      student: {
        id: student.id,
        displayName: student.displayName,
        firstName: student.firstName,
        lastName: student.lastName,
        schoolName: student.schoolName,
        gradeLabel: student.gradeLabel,
        graduationYear: student.graduationYear,
        learningNeeds: student.learningNeeds,
        lifecycle: student.lifecycle,
        availabilityNotes: student.availabilityNotes,
        emergencyContact: student.emergencyContact,
        changeRequestStatus: student.changeRequestStatus,
        pendingIntakeNote: student.pendingIntakeNote,
      },
      householdName: family.household.displayName,
      scheduleLabel,
      history,
      hasActiveService: Boolean(activeBooking) || student.lifecycle === "active",
    });
  } catch (error) {
    console.warn("[family/students/:id] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load student" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const family = await getFamilyContext();
    if (!family) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }
    if (!family.guardian.canManageStudents) {
      return NextResponse.json({ ok: false, error: "Not allowed to manage students" }, { status: 403 });
    }

    const { id } = await context.params;
    const student = await loadOwnedStudent(family.household.id, id);
    if (!student) {
      return NextResponse.json({ ok: false, error: "Student not found" }, { status: 404 });
    }

    const body = (await request.json()) as PatchBody;
    const preferredName = (body.preferredName ?? "").trim();
    const schoolName = (body.schoolName ?? "").trim();
    const gradeLabel = (body.gradeLabel ?? "").trim();
    const availabilityNotes = (body.availabilityNotes ?? "").trim();
    const emergencyContact = (body.emergencyContact ?? "").trim();
    const intakeUpdate = (body.intakeUpdate ?? "").trim();
    const graduationYear = parseGraduationYear(body.graduationYear);

    if (!preferredName || !availabilityNotes) {
      return NextResponse.json(
        { ok: false, error: "Preferred name and availability / preferences are required." },
        { status: 400 },
      );
    }
    if (!schoolName || !gradeLabel || !graduationYear) {
      return NextResponse.json(
        { ok: false, error: "School, grade, and graduation year are required." },
        { status: 400 },
      );
    }
    if (!isValidOptionId("GRADE_LABELS", gradeLabel)) {
      return NextResponse.json({ ok: false, error: "Invalid grade selection." }, { status: 400 });
    }

    const staffReviewNeeded =
      schoolName !== (student.schoolName ?? "") ||
      gradeLabel !== (student.gradeLabel ?? "") ||
      Boolean(intakeUpdate);

    const changeRequestStatus = staffReviewNeeded ? "Pending staff review" : "Applied";
    const guardianName = `${family.guardian.firstName} ${family.guardian.lastName}`.trim() || "Guardian";
    const historyEntry = `Guardian profile update · ${changeRequestStatus} · ${guardianName}`;
    const nextHistory = [historyEntry, ...asHistory(student.serviceHistory)].slice(0, 40);

    const database = requireDb();
    const [updated] = await database
      .update(students)
      .set({
        displayName: preferredName,
        schoolName,
        gradeLabel,
        graduationYear,
        availabilityNotes,
        emergencyContact: emergencyContact || null,
        pendingIntakeNote: intakeUpdate || null,
        changeRequestStatus,
        serviceHistory: nextHistory,
        updatedAt: new Date(),
      })
      .where(and(eq(students.id, student.id), eq(students.householdId, family.household.id)))
      .returning();

    return NextResponse.json({
      ok: true,
      staffReviewNeeded,
      changeRequestStatus,
      student: {
        id: updated.id,
        displayName: updated.displayName,
        schoolName: updated.schoolName,
        gradeLabel: updated.gradeLabel,
        graduationYear: updated.graduationYear,
        learningNeeds: updated.learningNeeds,
        lifecycle: updated.lifecycle,
        availabilityNotes: updated.availabilityNotes,
        emergencyContact: updated.emergencyContact,
        changeRequestStatus: updated.changeRequestStatus,
        pendingIntakeNote: updated.pendingIntakeNote,
      },
    });
  } catch (error) {
    console.warn("[family/students/:id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update student" }, { status: 500 });
  }
}
