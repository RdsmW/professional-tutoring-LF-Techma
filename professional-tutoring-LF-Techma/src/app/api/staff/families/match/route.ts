import { NextResponse } from "next/server";
import { findHouseholdMatchCandidates } from "@/lib/staff/family-match";
import { getStaffContext } from "@/lib/staff/session";

async function runMatch(emailRaw: string, phoneRaw: string) {
  const email = emailRaw.trim();
  const phone = phoneRaw.trim();
  if (!email && !phone) {
    return NextResponse.json(
      { ok: false, error: "Provide an email and/or phone to search." },
      { status: 400 },
    );
  }

  const candidates = await findHouseholdMatchCandidates({ email, phone });
  return NextResponse.json({
    ok: true,
    candidates,
  });
}

export async function GET(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    return await runMatch(searchParams.get("email") ?? "", searchParams.get("phone") ?? "");
  } catch (error) {
    console.warn("[staff/families/match] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to search families." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as { email?: string; phone?: string };
    return await runMatch(body.email ?? "", body.phone ?? "");
  } catch (error) {
    console.warn("[staff/families/match] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to search families." }, { status: 500 });
  }
}
