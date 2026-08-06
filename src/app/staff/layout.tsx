import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StaffShell } from "@/components/staff-shell";
import { ensureStaffProfile, resolveAppRole } from "@/lib/auth/roles";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session.userId) redirect("/sign-in");

  const role = await resolveAppRole(session.userId);
  if (role !== "staff") redirect("/family");

  try {
    await ensureStaffProfile();
  } catch {
    // Allow shell to render when DATABASE_URL is not yet configured.
  }

  const user = await currentUser();
  const personName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.primaryEmailAddress?.emailAddress ||
    "Staff";

  return <StaffShell personName={personName}>{children}</StaffShell>;
}
