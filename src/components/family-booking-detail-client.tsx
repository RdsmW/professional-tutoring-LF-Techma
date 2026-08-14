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
  cancellationReason: string | null;
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

export function FamilyBookingDetailClient({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/family/bookings/${bookingId}`);
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
  }, [bookingId]);

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading booking…</p>;
  if (error || !booking) return <p className="form-error">{error || "Booking not found."}</p>;

  return (
    <>
      <Link href="/family" className="page-back" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Home
      </Link>
      <Panel title="Your tutoring request">
        <div className="family-detail-grid profile-detail-grid">
          <Field label="Status" value={booking.status.replace(/_/g, " ")} />
          <Field label="Student" value={booking.studentName} />
          <Field label="Subject" value={booking.subjectName} />
          <Field label="Tutor" value={booking.tutorName} />
          <Field label="Schedule" value={booking.scheduleLabel || "Pending"} />
          <Field label="Submitted" value={formatWhen(booking.createdAt)} />
          <Field label="Confirmed" value={formatWhen(booking.confirmedAt)} />
          {booking.cancellationReason ? (
            <Field label="Cancellation reason" value={booking.cancellationReason} />
          ) : null}
        </div>
      </Panel>
    </>
  );
}
