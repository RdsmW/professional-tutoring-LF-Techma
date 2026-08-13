import { redirect } from "next/navigation";

/** Support UI temporarily hidden; restore StaffSupportClient when re-enabled. */
export default function StaffSupportPage() {
  redirect("/staff");
}
