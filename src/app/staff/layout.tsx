import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StaffShell } from "@/components/staff-shell";
import { resolveAppRoleSafe, resolveDisplayName } from "@/lib/auth/clerk";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session.userId) redirect("/sign-in");

  const role = await resolveAppRoleSafe();
  if (role !== "staff") redirect("/family");

  // Never await a throwing Clerk Backend call here — shell must paint.
  const personName = await resolveDisplayName("Staff");

  return <StaffShell personName={personName}>{children}</StaffShell>;
}
