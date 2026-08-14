"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui";

type EnrollmentDetail = {
  id: string;
  status: string;
  studentName: string;
  courseName: string;
  scheduleLabel: string | null;
  requestedSlotPreference: string | null;
  referralSource: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatWhen(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  );
}

export function FamilyEnrollmentDetailClient({ enrollmentId }: { enrollmentId: string }) {
  const [enrollment, setEnrollment] = useState<EnrollmentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/family/enrollments/${enrollmentId}`);
        const data = await response.json();
        if (!response.ok || !data.ok) {
          setError(data.error || "Unable to load enrollment.");
          return;
        }
        setEnrollment(data.enrollment);
      } catch {
        setError("Unable to load enrollment.");
      } finally {
        setLoading(false);
      }
    })();
  }, [enrollmentId]);

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading enrollment…</p>;
  if (error || !enrollment) return <p className="form-error">{error || "Enrollment not found."}</p>;

  return (
    <>
      <Link href="/family" className="page-back" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Home
      </Link>
      <Panel title="Your course enrollment">
        <div className="family-detail-grid profile-detail-grid">
          <Field label="Status" value={enrollment.status.replace(/_/g, " ")} />
          <Field label="Student" value={enrollment.studentName} />
          <Field label="Course" value={enrollment.courseName} />
          <Field label="Schedule" value={enrollment.scheduleLabel || "Pending"} />
          <Field label="Slot preference" value={enrollment.requestedSlotPreference || "—"} />
          <Field label="Referral" value={enrollment.referralSource || "—"} />
          <Field label="Submitted" value={formatWhen(enrollment.createdAt)} />
          {enrollment.notes ? <Field label="Notes" value={enrollment.notes} /> : null}
        </div>
      </Panel>
    </>
  );
}
