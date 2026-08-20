import { redirect } from "next/navigation";

export default function StaffPublicFormsPage() {
  redirect("/staff/settings?tab=public-forms");
}