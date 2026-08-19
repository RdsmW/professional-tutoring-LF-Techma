import { NextResponse } from "next/server";
import {
  PublicIntakeError,
  submitAyTutoringRegistration,
  type AyTutoringRegistrationInput,
} from "@/lib/public-intake/ay-tutoring-registration";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as AyTutoringRegistrationInput | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid registration data." }, { status: 400 });
    }
    const result = await submitAyTutoringRegistration(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof PublicIntakeError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.warn("[public/ay-tutoring-registration] fail", error);
    return NextResponse.json({ ok: false, error: "Unable to submit registration." }, { status: 500 });
  }
}
