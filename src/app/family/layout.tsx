import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FamilyShell } from "@/components/family-shell";
import { resolveAppRoleSafe, resolveDisplayName } from "@/lib/auth/clerk";

export default async function FamilyLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session.userId) redirect("/sign-in");

  const role = await resolveAppRoleSafe();
  if (role !== "family") redirect("/staff");

  // Never await a throwing Clerk Backend call here — shell must paint.
  const personName = await resolveDisplayName("Family");

  return <FamilyShell personName={personName}>{children}</FamilyShell>;
}
