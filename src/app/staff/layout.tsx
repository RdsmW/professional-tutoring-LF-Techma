import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StaffShell } from "@/components/staff-shell";
import { resolveAppRole } from "@/lib/auth/roles";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session.userId) redirect("/sign-in");

  const role = await resolveAppRole(session.userId);
  if (role !== "staff") redirect("/family");

  // Profile upsert runs after first paint via API later; do not block login on DB.
  const user = await currentUser();
  const personName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.primaryEmailAddress?.emailAddress ||
    "Staff";

  return <StaffShell personName={personName}>{children}</StaffShell>;
}
