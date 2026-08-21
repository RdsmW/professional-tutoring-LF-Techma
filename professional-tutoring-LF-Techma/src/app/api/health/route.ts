import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "professional-tutoring-app",
    stage: 1,
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    clerkConfigured: Boolean(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
    ),
  });
}
