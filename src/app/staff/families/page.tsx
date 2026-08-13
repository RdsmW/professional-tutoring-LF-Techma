import { StaffFamiliesClient } from "@/components/staff-families-client";
import { listStaffFamilies } from "@/lib/staff/families";
import { getStaffContext } from "@/lib/staff/session";

export default async function StaffFamiliesPage() {
  const context = await getStaffContext();
  let initialFamilies: Awaited<ReturnType<typeof listStaffFamilies>> = [];
  if (context) {
    try {
      initialFamilies = await listStaffFamilies();
    } catch (error) {
      console.warn("[staff/families page] soft-fail", error);
    }
  }

  return <StaffFamiliesClient initialFamilies={initialFamilies} />;
}
