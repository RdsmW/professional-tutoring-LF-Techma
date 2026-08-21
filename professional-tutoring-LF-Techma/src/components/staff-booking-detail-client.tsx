"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui";

type BookingDetail = {
  id: string;
  status: string;
  studentName: string;
  tutorName: string;
  subjectName: string;
  scheduleLabel: string | null;
  seatsClaimed: number;
  confirmedAt: string | null;
  holdExpiresAt?: string | null;
  cancellationReason: string | null;
  attendanceStatus?: string | null;
  attendanceNotes?: string | null;
  attendanceRecordedAt?: string | null;
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

export function StaffBookingDetailClient({
  familyId,
  bookingId,
}: {
  familyId: string;
  bookingId: string;
}) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/staff/families/${familyId}/bookings/${bookingId}`);
        const data = await response.json();
        if (!response.ok || !data.ok) {
          setError(data.error || "Unable to load booking.");
          return;
        }
        setBooking(data.booking);
      } catch {
        setError("Unable to load booking.");
      } finally {
        setLoading(false);
      }
    })();
  }, [familyId, bookingId]);

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading booking…</p>;
  if (error || !booking) return <p className="form-error">{error || "Booking not found."}</p>;

  return (
    <>
      <Link
        href={`/staff/families/${familyId}`}
        className="page-back"
        style={{ display: "inline-block", marginBottom: 12 }}
      >
        ← Family
      </Link>
      <Panel title="Tutoring booking submission">
        <div className="family-detail-grid profile-detail-grid">
          <Field label="Status" value={booking.status.replace(/_/g, " ")} />
          <Field label="Student" value={booking.studentName} />
          <Field label="Subject" value={booking.subjectName} />
          <Field label="Tutor" value={booking.tutorName} />
          <Field label="Schedule" value={booking.scheduleLabel || "Pending"} />
          <Field label="Seats" value={String(booking.seatsClaimed)} />
          <Field label="Submitted" value={formatWhen(booking.createdAt)} />
          <Field label="Updated" value={formatWhen(booking.updatedAt)} />
          <Field label="Confirmed" value={formatWhen(booking.confirmedAt)} />
          {booking.holdExpiresAt ? (
            <Field label="Hold expires" value={formatWhen(booking.holdExpiresAt)} />
          ) : null}
          {booking.cancellationReason ? (
            <Field label="Cancellation reason" value={booking.cancellationReason} />
          ) : null}
          {booking.attendanceStatus ? (
            <Field label="Attendance" value={booking.attendanceStatus} />
          ) : null}
          {booking.attendanceNotes ? (
            <Field label="Attendance notes" value={booking.attendanceNotes} />
          ) : null}
          {booking.attendanceRecordedAt ? (
            <Field label="Attendance recorded" value={formatWhen(booking.attendanceRecordedAt)} />
          ) : null}
        </div>
      </Panel>
    </>
  );
}
