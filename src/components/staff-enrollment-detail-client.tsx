"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui";

type EnrollmentDetail = {
  id: string;
  status: string;
  studentName: string;
  courseName: string;
  courseActive?: boolean;
  scheduleLabel: string | null;
  requestedSlotPreference: string | null;
  referralSource: string | null;
  notes: string | null;
  requestedBy?: string | null;
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

export function StaffEnrollmentDetailClient({
  familyId,
  enrollmentId,
}: {
  familyId: string;
  enrollmentId: string;
}) {
  const [enrollment, setEnrollment] = useState<EnrollmentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/staff/families/${familyId}/enrollments/${enrollmentId}`);
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
  }, [familyId, enrollmentId]);

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading enrollment…</p>;
  if (error || !enrollment) return <p className="form-error">{error || "Enrollment not found."}</p>;

  return (
    <>
      <Link
        href={`/staff/families/${familyId}`}
        className="page-back"
        style={{ display: "inline-block", marginBottom: 12 }}
      >
        ← Family
      </Link>
      <Panel title="Course enrollment submission">
        <div className="family-detail-grid profile-detail-grid">
          <Field label="Status" value={enrollment.status.replace(/_/g, " ")} />
          <Field label="Student" value={enrollment.studentName} />
          <Field label="Course" value={enrollment.courseName} />
          {enrollment.courseActive != null ? (
            <Field label="Course active" value={enrollment.courseActive ? "Yes" : "No"} />
          ) : null}
          <Field label="Schedule" value={enrollment.scheduleLabel || "Pending"} />
          <Field label="Slot preference" value={enrollment.requestedSlotPreference || "—"} />
          <Field label="Referral" value={enrollment.referralSource || "—"} />
          {enrollment.requestedBy ? <Field label="Requested by" value={enrollment.requestedBy} /> : null}
          <Field label="Submitted" value={formatWhen(enrollment.createdAt)} />
          <Field label="Updated" value={formatWhen(enrollment.updatedAt)} />
          <Field label="Notes" value={enrollment.notes || "—"} />
        </div>
      </Panel>
    </>
  );
}
