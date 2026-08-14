"use client";

import { FamilyHomeCreateMenu } from "@/components/family-home-create-menu";
import { useFamilyPortal } from "@/components/family-portal-context";

export function FamilyHomeHero() {
  const { householdName } = useFamilyPortal();

  return (
    <section className="family-hero">
      <div>
        <h1 style={{ margin: "0 0 10px", font: "700 32px/1.15 Georgia, serif" }}>
          {householdName ? `Welcome to the ${householdName} account.` : "Welcome to your family account."}
        </h1>
        <p>Manage children, then book tutoring or enroll in a course.</p>
      </div>
      <FamilyHomeCreateMenu />
    </section>
  );
}
