"use client";

import Link from "next/link";
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
        <div className="hero-actions" style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/family/students"
            className="primary-button family-primary"
            style={{
              textDecoration: "none",
              display: "inline-block",
              padding: "10px 14px",
              background: "var(--coral)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            Students
          </Link>
          <Link
            href="/family/book-tutoring"
            className="secondary-button"
            style={{
              textDecoration: "none",
              display: "inline-block",
              padding: "10px 14px",
              border: "1px solid var(--line)",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            Book Tutoring
          </Link>
        </div>
      </div>
    </section>
  );
}
