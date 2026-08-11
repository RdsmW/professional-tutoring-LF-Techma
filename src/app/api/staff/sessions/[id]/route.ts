import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  availabilitySlots,
  bookings,
  households,
  students,
  subjects,
  tutors,
} from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

const ATTENDANCE_STATUSES = new Set(["present", "absent", "late", "excused"]);

type PatchBody = {
  attendanceStatus?: string | null;
  attendanceNotes?: string | null;
  status?: string;
  cancellationReason?: string | null;
};

async function loadSessionDetail(sessionId: string) {
  const database = requireDb();
  const [row] = await database
    .select({
      id: bookings.id,
      status: bookings.status,
      seatsClaimed: bookings.seatsClaimed,
      cancellationReason: bookings.cancellationReason,
      attendanceStatus: bookings.attendanceStatus,
      attendanceNotes: bookings.attendanceNotes,
      attendanceRecordedAt: bookings.attendanceRecordedAt,
      attendanceRecordedByStaffId: bookings.attendanceRecordedByStaffId,
      confirmedAt: bookings.confirmedAt,
      holdExpiresAt: bookings.holdExpiresAt,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      tutoringRequestId: bookings.tutoringRequestId,
      householdId: bookings.householdId,
      studentId: bookings.studentId,
      subjectId: bookings.subjectId,
      tutorId: bookings.tutorId,
      slotId: bookings.slotId,
      studentName: students.displayName,
      studentFirstName: students.firstName,
      studentLastName: students.lastName,
      studentGrade: students.gradeLabel,
      studentSchool: students.schoolName,
      householdName: households.displayName,
      tutorName: tutors.displayName,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      slotDayOfWeek: availabilitySlots.dayOfWeek,
      slotStart: availabilitySlots.startTimeLocal,
      slotEnd: availabilitySlots.endTimeLocal,
      slotLabel: availabilitySlots.label,
    })
    .from(bookings)
    .innerJoin(students, eq(bookings.studentId, students.id))
    .innerJoin(households, eq(bookings.householdId, households.id))
    .leftJoin(tutors, eq(bookings.tutorId, tutors.id))
    .leftJoin(subjects, eq(bookings.subjectId, subjects.id))
    .leftJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
    .where(eq(bookings.id, sessionId))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    seatsClaimed: row.seatsClaimed,
    cancellationReason: row.cancellationReason,
    attendanceStatus: row.attendanceStatus,
    attendanceNotes: row.attendanceNotes,
    attendanceRecordedAt: row.attendanceRecordedAt?.toISOString() ?? null,
    attendanceRecordedByStaffId: row.attendanceRecordedByStaffId,
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
    holdExpiresAt: row.holdExpiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    tutoringRequestId: row.tutoringRequestId,
    householdId: row.householdId,
    studentId: row.studentId,
    subjectId: row.subjectId,
    tutorId: row.tutorId,
    slotId: row.slotId,
    student: {
      id: row.studentId,
      displayName: row.studentName,
      firstName: row.studentFirstName,
      lastName: row.studentLastName,
      gradeLabel: row.studentGrade,
      schoolName: row.studentSchool,
    },
    household: {
      id: row.householdId,
      displayName: row.householdName,
    },
    tutor: row.tutorId
      ? {
          id: row.tutorId,
          displayName: row.tutorName,
        }
      : null,
    subject: row.subjectId
      ? {
          id: row.subjectId,
          name: row.subjectName,
          code: row.subjectCode,
        }
      : null,
    slot: row.slotId
      ? {
          id: row.slotId,
          dayOfWeek: row.slotDayOfWeek,
          startTimeLocal: row.slotStart,
          endTimeLocal: row.slotEnd,
          label: row.slotLabel,
        }
      : null,
  };
}

export async function GET(
  _request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await contextParams.params;
    const session = await loadSessionDetail(id);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, session });
  } catch (error) {
    console.warn("[staff/sessions/id] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load session." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await contextParams.params;
    const body = (await request.json()) as PatchBody;
    const database = requireDb();

    const [existing] = await database.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });
    }

    const updates: Partial<typeof bookings.$inferInsert> = { updatedAt: new Date() };
    let touchedAttendance = false;

    if (body.attendanceStatus !== undefined) {
      if (body.attendanceStatus === null || body.attendanceStatus === "") {
        updates.attendanceStatus = null;
      } else {
        const status = String(body.attendanceStatus).trim();
        if (!ATTENDANCE_STATUSES.has(status)) {
          return NextResponse.json({ ok: false, error: "Invalid attendance status." }, { status: 400 });
        }
        updates.attendanceStatus = status;
      }
      touchedAttendance = true;
    }

    if (body.attendanceNotes !== undefined) {
      updates.attendanceNotes =
        body.attendanceNotes === null ? null : String(body.attendanceNotes).trim() || null;
      touchedAttendance = true;
    }

    if (touchedAttendance) {
      updates.attendanceRecordedAt = new Date();
      updates.attendanceRecordedByStaffId = context.staff.id;
    }

    if (body.status !== undefined) {
      const status = String(body.status).trim();
      if (status !== "cancelled") {
        return NextResponse.json(
          { ok: false, error: "Only status cancel is supported from session detail." },
          { status: 400 },
        );
      }
      updates.status = "cancelled";
      if (body.cancellationReason !== undefined) {
        updates.cancellationReason =
          body.cancellationReason === null
            ? null
            : String(body.cancellationReason).trim() || null;
      }
    } else if (body.cancellationReason !== undefined) {
      updates.cancellationReason =
        body.cancellationReason === null
          ? null
          : String(body.cancellationReason).trim() || null;
    }

    if (Object.keys(updates).length > 1) {
      await database.update(bookings).set(updates).where(eq(bookings.id, id));
    }

    const session = await loadSessionDetail(id);
    return NextResponse.json({ ok: true, session });
  } catch (error) {
    console.warn("[staff/sessions/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update session." }, { status: 500 });
  }
}
