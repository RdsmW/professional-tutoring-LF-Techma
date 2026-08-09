import { redirect } from "next/navigation";
import { resolvePortalIdentity } from "@/lib/auth/clerk";

export default async function HomePage() {
  const identity = await resolvePortalIdentity("User");
  if (!identity.userId) redirect("/sign-in");
  redirect(identity.role === "staff" ? "/staff" : "/family");
}
