import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { bookings, households, students, tutors } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

const BOOKING_STATUSES = new Set([
  "draft",
  "held",
  "pending_payment",
  "pending_staff_review",
  "confirmed",
  "cancelled",
  "failed",
]);

export async function GET(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") ?? "").trim();
    const q = (searchParams.get("q") ?? "").trim();

    if (status && !BOOKING_STATUSES.has(status)) {
      return NextResponse.json({ ok: false, error: "Invalid status filter." }, { status: 400 });
    }

    const database = requireDb();
    const filters: SQL[] = [];
    if (status) {
      filters.push(eq(bookings.status, status as typeof bookings.$inferSelect.status));
    }
    if (q) {
      const pattern = `%${q}%`;
      filters.push(
        or(
          ilike(students.displayName, pattern),
          ilike(tutors.displayName, pattern),
          ilike(households.displayName, pattern),
        )!,
      );
    }

    const rows = await database
      .select({
        id: bookings.id,
        status: bookings.status,
        studentId: bookings.studentId,
        householdId: bookings.householdId,
        createdAt: bookings.createdAt,
        studentName: students.displayName,
        tutorName: tutors.displayName,
        householdName: households.displayName,
      })
      .from(bookings)
      .innerJoin(students, eq(bookings.studentId, students.id))
      .innerJoin(households, eq(bookings.householdId, households.id))
      .leftJoin(tutors, eq(bookings.tutorId, tutors.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(bookings.createdAt));

    return NextResponse.json({
      ok: true,
      sessions: rows.map((row) => ({
        id: row.id,
        status: row.status,
        studentName: row.studentName,
        tutorName: row.tutorName,
        householdName: row.householdName,
        householdId: row.householdId,
        studentId: row.studentId,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.warn("[staff/sessions] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load sessions." }, { status: 500 });
  }
}
