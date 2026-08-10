"use client";

import Link from "next/link";
import { useFamilyPortal } from "@/components/family-portal-context";

export function FamilyHomeHero() {
  const { householdName, householdStatus } = useFamilyPortal();
  const pending = householdStatus === "pending";

  return (
    <>
      <section className="family-hero">
        <div>
          <span className="eyebrow">Family Portal</span>
          <h1 style={{ margin: "6px 0 10px", font: "700 32px/1.15 Georgia, serif" }}>
            {householdName ? `Welcome, ${householdName}` : "Welcome home"}
          </h1>
          <p>
            Parent = Family account. Add students, then choose Book Tutoring or Enroll in Courses.
            General inquiries stay in Zoho — this portal is for registered service journeys.
          </p>
          <div className="hero-actions" style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {pending ? (
              <Link
                href="/family/onboarding"
                className="primary-button family-primary"
                style={{
                  textDecoration: "none",
                  display: "inline-block",
                  padding: "10px 14px",
                  background: "var(--coral)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 11,
                }}
              >
                Complete onboarding
              </Link>
            ) : null}
            <Link
              href="/family/students?add=1"
              className="primary-button family-primary"
              style={{
                textDecoration: "none",
                display: "inline-block",
                padding: "10px 14px",
                background: "var(--coral)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 11,
              }}
            >
              + Add student
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
                fontSize: 11,
              }}
            >
              Book Tutoring
            </Link>
            <Link
              href="/family/enroll-courses"
              className="secondary-button"
              style={{
                textDecoration: "none",
                display: "inline-block",
                padding: "10px 14px",
                border: "1px solid var(--line)",
                fontWeight: 800,
                fontSize: 11,
              }}
            >
              Enroll in Courses
            </Link>
          </div>
        </div>
      </section>

      {pending ? (
        <section className="recommendation-banner" style={{ marginBottom: 16 }}>
          <span>i</span>
          <div>
            <strong>Onboarding still pending</strong>
            <p>
              Finish your family profile so staff can place students and unlock the full portal journey.
            </p>
          </div>
        </section>
      ) : null}
    </>
  );
}
