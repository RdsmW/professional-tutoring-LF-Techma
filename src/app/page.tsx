import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { resolveAppRole } from "@/lib/auth/roles";

export default async function HomePage() {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in");
  }

  const role = await resolveAppRole(session.userId);
  redirect(role === "staff" ? "/staff" : "/family");
}
