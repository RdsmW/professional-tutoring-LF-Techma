import { Suspense } from "react";
import { FamilyStudentsClient } from "@/components/family-students-client";
import { getFamilyContext, listHouseholdStudents } from "@/lib/family/session";

export default async function FamilyStudentsPage() {
  let initialStudents: {
    id: string;
    displayName: string;
    schoolName: string | null;
    gradeLabel: string | null;
    graduationYear: number | null;
    learningNeeds: string | null;
    lifecycle: string;
  }[] = [];

  try {
    const context = await getFamilyContext();
    if (context) {
      const rows = await listHouseholdStudents(context.household.id);
      initialStudents = rows.map((row) => ({
        id: row.id,
        displayName: row.displayName,
        schoolName: row.schoolName,
        gradeLabel: row.gradeLabel,
        graduationYear: row.graduationYear,
        learningNeeds: row.learningNeeds,
        lifecycle: row.lifecycle,
      }));
    }
  } catch {
    initialStudents = [];
  }

  return (
    <Suspense fallback={<p style={{ color: "var(--muted)", fontSize: 12 }}>Loading students…</p>}>
      <FamilyStudentsClient initialStudents={initialStudents} />
    </Suspense>
  );
}
