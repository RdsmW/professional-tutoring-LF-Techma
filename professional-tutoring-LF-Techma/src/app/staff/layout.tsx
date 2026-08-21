import { redirect } from "next/navigation";
import { StaffShell } from "@/components/staff-shell";
import { resolveStaffPortalGate } from "@/lib/auth/clerk";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const identity = await resolveStaffPortalGate("Staff");
  if (!identity.userId) redirect("/sign-in");
  if (identity.role !== "staff") redirect("/family");

  return <StaffShell personName={identity.displayName}>{children}</StaffShell>;
}
