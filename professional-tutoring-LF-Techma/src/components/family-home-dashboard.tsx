"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FamilyHomeHero } from "@/components/family-home-hero";
import { learningNeedChips } from "@/lib/family/learning-needs";
import { formatGradeLabel } from "@/lib/ui/grade";

type HomeStudent = {
  id: string;
  displayName: string;
  schoolName: string | null;
  gradeLabel: string | null;
  learningNeeds: string | null;
  lifecycle: string;
};

type HomeBooking = {
  id: string;
  status: string;
  studentName: string;
  tutorName: string | null;
  subjectName: string | null;
  timeLabel: string;
};

type HomeEnrollment = {
  id: string;
  status: string;
  studentName: string;
  courseName: string;
  scheduleLabel: string;
};

type HomeData = {
  students: HomeStudent[];
  bookings: HomeBooking[];
  enrollments: HomeEnrollment[];
  household: {
    displayName: string;
    status: string;
    cardLast4: string | null;
    cardBrand: string | null;
  };
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function FamilyHomeDashboard() {
  const [data, setData] = useState<HomeData | null>(null);

  useEffect(() => {
    void fetch("/api/family/home")
      .then((response) => response.json())
      .then((payload) => {
        if (payload?.ok) {
          setData({
            students: payload.students ?? [],
            bookings: payload.bookings ?? [],
            enrollments: payload.enrollments ?? [],
            household: payload.household,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  const students = data?.students ?? [];
  const bookings = data?.bookings ?? [];
  const enrollments = data?.enrollments ?? [];
  const latestBooking = bookings[0] ?? null;
  const latestEnrollment = enrollments[0] ?? null;
  const billingLabel = data?.household.cardLast4
    ? `${(data.household.cardBrand || "Card").toUpperCase()} ···· ${data.household.cardLast4}`
    : "No card on file";

  return (
    <>
      <FamilyHomeHero />

      {latestBooking || latestEnrollment ? (
        <section
          className="completion-strip"
          style={{
            gridTemplateColumns:
              latestBooking && latestEnrollment ? "1fr 1fr" : "1fr",
          }}
        >
          {latestBooking ? (
            <Link href={`/family/bookings/${latestBooking.id}`}>
              <span>✓</span>
              <div>
                <strong>Tutoring request saved</strong>
                <small>
                  {latestBooking.studentName}
                  {latestBooking.subjectName ? ` · ${latestBooking.subjectName}` : ""}
                  {latestBooking.tutorName ? ` · ${latestBooking.tutorName}` : ""}
                  {` · ${latestBooking.timeLabel}`}
                  {` · ${latestBooking.status.replace(/_/g, " ")}`}
                </small>
              </div>
              <b>View details →</b>
            </Link>
          ) : null}
          {latestEnrollment ? (
            <Link href={`/family/enrollments/${latestEnrollment.id}`}>
              <span>✓</span>
              <div>
                <strong>{latestEnrollment.courseName} enrollment submitted</strong>
                <small>
                  {latestEnrollment.studentName} · {latestEnrollment.scheduleLabel} ·{" "}
                  {latestEnrollment.status.replace(/_/g, " ")}
                </small>
              </div>
              <b>View details →</b>
            </Link>
          ) : null}
        </section>
      ) : null}

      <section className="family-metrics">
        <article>
          <small>Students</small>
          <strong>
            {students.length} child profile{students.length === 1 ? "" : "s"}
          </strong>
          <Link href="/family/students">Students →</Link>
        </article>
        <article>
          <small>Next session</small>
          <strong>{latestBooking?.timeLabel ?? "None scheduled"}</strong>
          <span>
            {latestBooking
              ? `${latestBooking.subjectName ?? "Tutoring"}${latestBooking.tutorName ? ` with ${latestBooking.tutorName}` : ""}`
              : "Book tutoring to reserve a slot"}
          </span>
        </article>
        <article>
          <small>Billing</small>
          <strong>{data?.household.cardLast4 ? "Card on file" : "Setup needed"}</strong>
          <span>{billingLabel}</span>
        </article>
      </section>

      <section className="service-decision">
        <article>
          <span className="service-number">01</span>
          <div>
            <span className="eyebrow">Individual service</span>
            <h3>Book Tutoring</h3>
            <p>
              Schedule individual tutoring for one child. Choose Academic-Year or Summer, subject,
              matching preference, and available time.
            </p>
          </div>
          <Link href="/family/book-tutoring" className="family-primary" style={{ textDecoration: "none" }}>
            Start tutoring booking
          </Link>
        </article>
        <article>
          <span className="service-number">02</span>
          <div>
            <span className="eyebrow">Defined cohort</span>
            <h3>Enroll in Courses</h3>
            <p>
              Register one child for a fixed-curriculum SAT/ACT cohort with defined dates and
              course-specific enrollment and billing.
            </p>
          </div>
          <Link href="/family/enroll-courses" className="secondary-button" style={{ textDecoration: "none" }}>
            Start course enrollment
          </Link>
        </article>
      </section>

      <div className="two-column" style={{ marginTop: 17 }}>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Your students</h3>
            </div>
            <Link href="/family/students" className="text-button" style={{ textDecoration: "none" }}>
              View all
            </Link>
          </div>
          {students.length === 0 ? (
            <div className="compact-empty">
              <p>No students yet.</p>
              <Link href="/family/students" className="text-button" style={{ display: "inline-block", marginTop: 10 }}>
                Go to Students →
              </Link>
            </div>
          ) : (
            <div className="compact-student-list">
              {students.slice(0, 4).map((student) => {
                const chips = learningNeedChips(student.learningNeeds, 2);
                return (
                  <Link key={student.id} href="/family/students">
                    <span className="mini-avatar">{initials(student.displayName)}</span>
                    <span>
                      <strong>{student.displayName}</strong>
                      <small>
                        {student.schoolName ?? "School pending"} · {formatGradeLabel(student.gradeLabel) ?? "Grade pending"}
                        {chips.length ? ` · ${chips.join(", ")}` : ""}
                      </small>
                    </span>
                    <b>Open →</b>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Upcoming</h3>
            </div>
            <Link href="/family/calendar" className="text-button" style={{ textDecoration: "none" }}>
              View calendar
            </Link>
          </div>
          {bookings.length === 0 && enrollments.length === 0 ? (
            <div className="compact-empty">
              <p>No tutoring or course requests yet. Bookings and enrollments will appear here.</p>
            </div>
          ) : (
            <div className="schedule-list">
              {bookings.slice(0, 2).map((booking) => (
                <Link
                  key={booking.id}
                  href={`/family/bookings/${booking.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "52px 1fr auto",
                    gap: 12,
                    alignItems: "center",
                    borderTop: "1px solid var(--line)",
                    padding: "12px 0",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span className="date-block">{booking.timeLabel.slice(0, 3) || "PT"}</span>
                  <span>
                    <strong style={{ display: "block", fontSize: 14 }}>
                      {booking.subjectName ?? "Tutoring"} · {booking.studentName}
                    </strong>
                    <small style={{ color: "var(--muted)", fontSize: 14 }}>
                      {booking.tutorName ?? "Tutor TBD"} · {booking.status.replace(/_/g, " ")}
                    </small>
                  </span>
                  <b style={{ fontSize: 14, color: "var(--blue)" }}>Open →</b>
                </Link>
              ))}
              {enrollments.slice(0, 2).map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/family/enrollments/${enrollment.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "52px 1fr auto",
                    gap: 12,
                    alignItems: "center",
                    borderTop: "1px solid var(--line)",
                    padding: "12px 0",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span className="date-block">CR</span>
                  <span>
                    <strong style={{ display: "block", fontSize: 14 }}>
                      {enrollment.courseName} · {enrollment.studentName}
                    </strong>
                    <small style={{ color: "var(--muted)", fontSize: 14 }}>
                      {enrollment.scheduleLabel} · {enrollment.status.replace(/_/g, " ")}
                    </small>
                  </span>
                  <b style={{ fontSize: 14, color: "var(--blue)" }}>Open →</b>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
