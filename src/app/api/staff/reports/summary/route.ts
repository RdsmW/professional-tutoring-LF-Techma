import { NextResponse } from "next/server";
import { and, count, desc, eq, inArray, isNotNull, sum } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  bookings,
  courseOfferings,
  households,
  paymentRecords,
  students,
  tutors,
} from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

const HOUSEHOLD_STATUSES = new Set(["active", "pending", "inactive", "archived"]);
const LIFECYCLES = new Set(["prospect", "active", "paused", "completed", "archived"]);
const OPEN_BOOKING_STATUSES = ["held", "pending_payment", "pending_staff_review", "confirmed"] as const;

export async function GET(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = (searchParams.get("status") ?? "active").trim();
    const lifecycleParam = (searchParams.get("lifecycle") ?? "").trim();

    if (!HOUSEHOLD_STATUSES.has(statusParam)) {
      return NextResponse.json({ ok: false, error: "Invalid household status filter." }, { status: 400 });
    }
    if (lifecycleParam && !LIFECYCLES.has(lifecycleParam)) {
      return NextResponse.json({ ok: false, error: "Invalid lifecycle filter." }, { status: 400 });
    }

    const householdStatus = statusParam as (typeof households.$inferSelect)["status"];
    const database = requireDb();

    const [
      activeFamilyCountRow,
      activeFamilyRows,
      lifecycleRows,
      activeTutorCountRow,
      tutorRows,
      bookingWorkloadRows,
      unpaidBillingRow,
      courseRows,
    ] = await Promise.all([
      database
        .select({ value: count() })
        .from(households)
        .where(eq(households.status, householdStatus))
        .then((rows) => rows[0]),
      database
        .select({
          id: households.id,
          displayName: households.displayName,
          status: households.status,
          updatedAt: households.updatedAt,
        })
        .from(households)
        .where(eq(households.status, householdStatus))
        .orderBy(desc(households.updatedAt))
        .limit(50),
      database
        .select({
          lifecycle: students.lifecycle,
          count: count(),
        })
        .from(students)
        .where(
          lifecycleParam
            ? eq(students.lifecycle, lifecycleParam as (typeof students.$inferSelect)["lifecycle"])
            : undefined,
        )
        .groupBy(students.lifecycle),
      database
        .select({ value: count() })
        .from(tutors)
        .where(eq(tutors.active, true))
        .then((rows) => rows[0]),
      database
        .select({
          id: tutors.id,
          displayName: tutors.displayName,
          active: tutors.active,
          maxSeatsPerSlot: tutors.maxSeatsPerSlot,
        })
        .from(tutors)
        .where(eq(tutors.active, true))
        .orderBy(desc(tutors.updatedAt)),
      database
        .select({
          tutorId: bookings.tutorId,
          workload: count(),
        })
        .from(bookings)
        .where(and(inArray(bookings.status, [...OPEN_BOOKING_STATUSES]), isNotNull(bookings.tutorId)))
        .groupBy(bookings.tutorId),
      database
        .select({
          count: count(),
          amountCentsSum: sum(paymentRecords.amountCents),
        })
        .from(paymentRecords)
        .where(inArray(paymentRecords.status, ["unpaid", "pending"]))
        .then((rows) => rows[0]),
      database
        .select({
          id: courseOfferings.id,
          name: courseOfferings.name,
          enrolledCount: courseOfferings.enrolledCount,
          capacity: courseOfferings.capacity,
          active: courseOfferings.active,
          termLabel: courseOfferings.termLabel,
        })
        .from(courseOfferings)
        .where(eq(courseOfferings.active, true))
        .orderBy(desc(courseOfferings.updatedAt)),
    ]);

    const workloadByTutor = new Map<string, number>();
    for (const row of bookingWorkloadRows) {
      if (row.tutorId) {
        workloadByTutor.set(row.tutorId, Number(row.workload ?? 0));
      }
    }

    const lifecycleCounts = lifecycleRows
      .map((row) => ({
        lifecycle: row.lifecycle,
        count: Number(row.count ?? 0),
      }))
      .sort((a, b) => a.lifecycle.localeCompare(b.lifecycle));

    return NextResponse.json({
      ok: true,
      filters: {
        status: householdStatus,
        lifecycle: lifecycleParam || null,
      },
      reports: {
        activeFamilies: {
          name: "Active families / students",
          count: Number(activeFamilyCountRow?.value ?? 0),
          households: activeFamilyRows.map((row) => ({
            id: row.id,
            displayName: row.displayName,
            status: row.status,
            updatedAt: row.updatedAt.toISOString(),
          })),
        },
        studentsByLifecycle: {
          name: "Students by lifecycle",
          total: lifecycleCounts.reduce((sumValue, row) => sumValue + row.count, 0),
          counts: lifecycleCounts,
        },
        tutorCapacity: {
          name: "Tutor utilization",
          activeTutorCount: Number(activeTutorCountRow?.value ?? 0),
          tutors: tutorRows.map((row) => ({
            id: row.id,
            displayName: row.displayName,
            active: row.active,
            maxSeatsPerSlot: row.maxSeatsPerSlot,
            bookingWorkloadCount: workloadByTutor.get(row.id) ?? 0,
          })),
        },
        unpaidBilling: {
          name: "Revenue / billing",
          count: Number(unpaidBillingRow?.count ?? 0),
          amountCentsSum: Number(unpaidBillingRow?.amountCentsSum ?? 0),
          statuses: ["unpaid", "pending"] as const,
        },
        courseFill: {
          name: "Course capacity",
          courses: courseRows.map((row) => ({
            id: row.id,
            name: row.name,
            enrolledCount: row.enrolledCount,
            capacity: row.capacity,
            active: row.active,
            termLabel: row.termLabel,
          })),
        },
      },
    });
  } catch (error) {
    console.warn("[staff/reports/summary] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load report summary." }, { status: 500 });
  }
}
