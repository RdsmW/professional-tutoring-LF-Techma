import { redirect } from "next/navigation";

/** Messages / Support UI temporarily hidden; restore FamilyMessagesClient when re-enabled. */
export default function FamilyMessagesPage() {
  redirect("/family");
}
