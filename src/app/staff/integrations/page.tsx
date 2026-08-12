import { redirect } from "next/navigation";

export default function StaffIntegrationsPage() {
  redirect("/staff/settings?tab=integrations");
}
