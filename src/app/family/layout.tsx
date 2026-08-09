import { redirect } from "next/navigation";
import { FamilyShell } from "@/components/family-shell";
import { resolveFamilyPortalGate } from "@/lib/auth/clerk";

export default async function FamilyLayout({ children }: { children: React.ReactNode }) {
  // JWT/auth only — avoids Clerk Backend latency on every Family navigation.
  const identity = await resolveFamilyPortalGate("Family");
  if (!identity.userId) redirect("/sign-in");
  if (identity.role !== "family") redirect("/staff");

  return <FamilyShell personName={identity.displayName}>{children}</FamilyShell>;
}
