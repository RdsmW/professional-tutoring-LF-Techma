import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FamilyShell } from "@/components/family-shell";
import { resolveAppRole } from "@/lib/auth/roles";

export default async function FamilyLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session.userId) redirect("/sign-in");

  const role = await resolveAppRole(session.userId);
  if (role !== "family") redirect("/staff");

  // Guardian upsert runs after first paint via API later; do not block login on DB.
  const user = await currentUser();
  const personName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.primaryEmailAddress?.emailAddress ||
    "Family";

  return <FamilyShell personName={personName}>{children}</FamilyShell>;
}
