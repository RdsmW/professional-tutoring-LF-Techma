import { NextResponse } from "next/server";
import { eq, or, sql, type SQL } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function phoneMatchSql(column: typeof guardians.phone | typeof households.primaryPhone, digits: string) {
  const trimmed = digits.length > 10 ? digits.slice(-10) : digits;
  return sql`regexp_replace(coalesce(${column}, ''), '[^0-9]', '', 'g') like ${`%${trimmed}%`}`;
}

type MatchCandidate = {
  householdId: string;
  householdName: string;
  householdStatus: string;
  guardian: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    matchOn: Array<"email" | "phone">;
  };
};

async function runMatch(emailRaw: string, phoneRaw: string) {
  const email = normalizeEmail(emailRaw);
  const phoneDigits = normalizePhoneDigits(phoneRaw);

  if (!email && !phoneDigits) {
    return NextResponse.json(
      { ok: false, error: "Provide an email and/or phone to search." },
      { status: 400 },
    );
  }

  const database = requireDb();
  const conditions: SQL[] = [];
  if (email) {
    conditions.push(sql`lower(${guardians.email}) = ${email}`);
  }
  if (phoneDigits) {
    conditions.push(phoneMatchSql(guardians.phone, phoneDigits));
    conditions.push(phoneMatchSql(households.primaryPhone, phoneDigits));
  }

  const rows = await database
    .select({
      householdId: households.id,
      householdName: households.displayName,
      householdStatus: households.status,
      householdPhone: households.primaryPhone,
      guardianId: guardians.id,
      guardianEmail: guardians.email,
      guardianFirstName: guardians.firstName,
      guardianLastName: guardians.lastName,
      guardianPhone: guardians.phone,
    })
    .from(guardians)
    .innerJoin(households, eq(guardians.householdId, households.id))
    .where(conditions.length === 1 ? conditions[0] : or(...conditions));

  const byGuardian = new Map<string, MatchCandidate>();
  for (const row of rows) {
    const matchOn: Array<"email" | "phone"> = [];
    const rowEmail = normalizeEmail(row.guardianEmail);
    if (email && rowEmail === email) matchOn.push("email");

    const guardianDigits = normalizePhoneDigits(row.guardianPhone ?? "");
    const householdDigits = normalizePhoneDigits(row.householdPhone ?? "");
    const needle = phoneDigits.length > 10 ? phoneDigits.slice(-10) : phoneDigits;
    if (
      phoneDigits &&
      ((guardianDigits && guardianDigits.endsWith(needle)) ||
        (householdDigits && householdDigits.endsWith(needle)) ||
        (guardianDigits && guardianDigits.includes(needle)) ||
        (householdDigits && householdDigits.includes(needle)))
    ) {
      matchOn.push("phone");
    }

    if (matchOn.length === 0) continue;

    const existing = byGuardian.get(row.guardianId);
    if (existing) {
      for (const key of matchOn) {
        if (!existing.guardian.matchOn.includes(key)) existing.guardian.matchOn.push(key);
      }
      continue;
    }

    byGuardian.set(row.guardianId, {
      householdId: row.householdId,
      householdName: row.householdName,
      householdStatus: row.householdStatus,
      guardian: {
        id: row.guardianId,
        name: `${row.guardianFirstName} ${row.guardianLastName}`.trim(),
        email: row.guardianEmail,
        phone: row.guardianPhone,
        matchOn,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    candidates: Array.from(byGuardian.values()),
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
