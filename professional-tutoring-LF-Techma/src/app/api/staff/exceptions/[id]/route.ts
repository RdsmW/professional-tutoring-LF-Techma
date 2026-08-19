import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { changeRequests } from "@/lib/db/schema";
import { loadStaffException } from "@/lib/staff/exceptions";
import { getStaffContext } from "@/lib/staff/session";

const PATCH_STATUSES = new Set(["under_review", "approved", "declined", "applied"]);

type PatchBody = {
  status?: string;
  staffNotes?: string | null;
};

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
    const exception = await loadStaffException(id);
    if (!exception) {
      return NextResponse.json({ ok: false, error: "Exception not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, exception });
  } catch (error) {
    console.warn("[staff/exceptions/id] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load exception." }, { status: 500 });
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

    const [existing] = await database
      .select({ id: changeRequests.id })
      .from(changeRequests)
      .where(eq(changeRequests.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Exception not found." }, { status: 404 });
    }

    const updates: Partial<typeof changeRequests.$inferInsert> = { updatedAt: new Date() };

    if (body.status !== undefined) {
      const status = body.status.trim();
      if (!PATCH_STATUSES.has(status)) {
        return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
      }
      updates.status = status as typeof changeRequests.$inferSelect.status;
      if (status === "approved" || status === "declined" || status === "applied") {
        updates.resolvedByStaffId = context.staff.id;
        updates.resolvedAt = new Date();
      } else {
        updates.resolvedByStaffId = null;
        updates.resolvedAt = null;
      }
    }

    if (body.staffNotes !== undefined) {
      updates.staffNotes = body.staffNotes?.trim() || null;
    }

    if (Object.keys(updates).length > 1) {
      await database.update(changeRequests).set(updates).where(eq(changeRequests.id, id));
    }

    const exception = await loadStaffException(id);
    return NextResponse.json({ ok: true, exception });
  } catch (error) {
    console.warn("[staff/exceptions/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update exception." }, { status: 500 });
  }
}
