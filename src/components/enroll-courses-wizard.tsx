"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StripeCardSaver } from "@/components/stripe-card-saver";
import type { EnrollFormId } from "@/lib/enrollment/course-map";

type Option = { id: string; label: string };
type Student = { id: string; displayName: string; gradeLabel: string | null; schoolName: string | null };
type Course = {
  id: string;
  code: string;
  formId: EnrollFormId;
  name: string;
  title: string;
  termLabel: string | null;
  scheduleSummary: string | null;
  description: string | null;
  seatsRemaining: number;
  tuitionLabel: string;
  registrationFeeLabel: string;
  materialsFeeLabel: string;
  paymentPlans: Option[];
  slotOptions: Option[];
};
type SavedCard = { brand: string | null; last4: string | null };

type Draft = {
  studentId: string;
  courseOfferingId: string;
  formId: EnrollFormId | "";
  paymentPlanId: string;
  slotPreference: string[];
  policyAck: boolean;
  paymentMethodConsent: boolean;
  cardSaved: boolean;
};

const steps = ["Student", "Course", "Program", "Billing", "Policy", "Review"];

const emptyDraft: Draft = {
  studentId: "",
  courseOfferingId: "",
  formId: "",
  paymentPlanId: "",
  slotPreference: [],
  policyAck: false,
  paymentMethodConsent: false,
  cardSaved: false,
};

export function EnrollCoursesWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState(true);
  const [householdStatus, setHouseholdStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    courseName: string;
    studentName: string;
    scheduleLabel: string;
  } | null>(null);

  const selectedStudent = students.find((student) => student.id === draft.studentId);
  const selectedCourse = courses.find((course) => course.id === draft.courseOfferingId);
  const paymentPlans = selectedCourse?.paymentPlans ?? [];
  const slotOptions = selectedCourse?.slotOptions ?? [];
  const selectedPlan = paymentPlans.find((plan) => plan.id === draft.paymentPlanId);

  useEffect(() => {
    const presetStudent = searchParams.get("studentId");
    void (async () => {
      try {
        const response = await fetch("/api/family/enroll-courses/options");
        const data = await response.json();
        if (!response.ok || !data.ok) {
          setError(data.error || "Unable to load enrollment options.");
          return;
        }
        setStudents(data.students ?? []);
        setCourses(data.courses ?? []);
        setStripeConfigured(Boolean(data.stripeConfigured));
        setHouseholdStatus(data.householdStatus);
        if (data.savedCard?.last4) {
          setSavedCard({ brand: data.savedCard.brand, last4: data.savedCard.last4 });
          setDraft((prev) => ({
            ...prev,
            cardSaved: true,
            paymentMethodConsent: Boolean(data.savedCard.consentAt),
          }));
        }
        if (presetStudent && (data.students ?? []).some((s: Student) => s.id === presetStudent)) {
          setDraft((prev) => ({ ...prev, studentId: presetStudent }));
          setStep(2);
        }
      } catch {
        setError("Unable to load enrollment options.");
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  const stepValid = useMemo(() => {
    if (step === 1) return Boolean(draft.studentId);
    if (step === 2) return Boolean(draft.courseOfferingId && draft.formId);
    if (step === 3) {
      if (!selectedCourse) return false;
      if (draft.formId === "first_class") return draft.slotPreference.length === 1;
      if (draft.formId === "summer_master_class") return draft.slotPreference.length > 0;
      return draft.formId === "express";
    }
    if (step === 4) return Boolean(draft.paymentPlanId);
    if (step === 5) {
      return Boolean(
        draft.policyAck && draft.paymentMethodConsent && draft.cardSaved && stripeConfigured,
      );
    }
    return true;
  }, [draft, selectedCourse, step, stripeConfigured]);

  function selectCourse(course: Course) {
    setDraft({
      ...draft,
      courseOfferingId: course.id,
      formId: course.formId,
      paymentPlanId: "",
      slotPreference: [],
    });
  }

  function toggleMasterSession(optionId: string) {
    setDraft((prev) => {
      const exists = prev.slotPreference.includes(optionId);
      return {
        ...prev,
        slotPreference: exists
          ? prev.slotPreference.filter((id) => id !== optionId)
          : [...prev.slotPreference, optionId],
      };
    });
  }

  async function confirmEnrollment() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/family/enroll-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: draft.studentId,
          courseOfferingId: draft.courseOfferingId,
          formId: draft.formId,
          paymentPlanId: draft.paymentPlanId,
          slotPreference:
            draft.formId === "summer_master_class"
              ? draft.slotPreference
              : draft.slotPreference[0] ?? "",
          policyAck: draft.policyAck,
          paymentMethodConsent: draft.paymentMethodConsent,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to confirm enrollment.");
        return;
      }
      setConfirmed({
        courseName: data.enrollment.courseName,
        studentName: data.enrollment.studentName,
        scheduleLabel: data.enrollment.scheduleLabel,
      });
      setStep(7);
    } catch {
      setError("Unable to confirm enrollment.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="panel">Loading enrollment options…</div>;
  }

  if (householdStatus !== "active") {
    return (
      <div className="panel">
        <h3>Onboarding required</h3>
        <p>Complete your family profile before enrolling in a course.</p>
        <button type="button" className="family-primary" onClick={() => router.push("/family/onboarding")}>
          Complete onboarding
        </button>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="panel">
        <h3>Add a student first</h3>
        <p>Course enrollment needs at least one student on the household.</p>
        <button type="button" className="family-primary" onClick={() => router.push("/family/students?add=1")}>
          Add student
        </button>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="panel success-state">
        <span>✓</span>
        <h3>Enrollment submitted</h3>
        <p>
          {confirmed.courseName} for {confirmed.studentName} is saved as submitted. Schedule:{" "}
          {confirmed.scheduleLabel}. Your card is on file with Stripe for future charges.
        </p>
        <div className="success-actions">
          <button type="button" className="family-primary" onClick={() => router.push("/family")}>
            Back to home
          </button>
          <button type="button" className="secondary-button" onClick={() => router.push("/family/students")}>
            View students
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setConfirmed(null);
              setDraft({
                ...emptyDraft,
                studentId: draft.studentId,
                cardSaved: draft.cardSaved,
                paymentMethodConsent: draft.paymentMethodConsent,
              });
              setStep(draft.studentId ? 2 : 1);
            }}
          >
            Enroll another
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="wizard-shell panel">
      <div className="wizard-progress">
        {steps.map((label, index) => (
          <div
            key={label}
            className={index + 1 < step ? "complete" : index + 1 === step ? "complete" : undefined}
          >
            <span>{index + 1}</span>
            <small>{label}</small>
          </div>
        ))}
      </div>

      {step === 1 ? (
        <div className="wizard-stage">
          <h3>Choose a student</h3>
          <div className="choice-grid two">
            {students.map((student) => (
              <button
                key={student.id}
                type="button"
                className={`choice-card${draft.studentId === student.id ? " selected" : ""}`}
                onClick={() => setDraft({ ...draft, studentId: student.id })}
              >
                <strong>{student.displayName}</strong>
                <p>{student.gradeLabel || "Grade TBD"}</p>
                <small>{student.schoolName || "School TBD"}</small>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="wizard-stage">
          <h3>Select a defined cohort course</h3>
          {courses.length === 0 ? (
            <div className="validation-hint">No active course offerings are available yet.</div>
          ) : (
            <div className="choice-grid">
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  className={`choice-card${draft.courseOfferingId === course.id ? " selected" : ""}`}
                  onClick={() => selectCourse(course)}
                  disabled={course.seatsRemaining <= 0}
                >
                  <strong>{course.title}</strong>
                  <p>{course.termLabel || "Cohort term"}</p>
                  <small>
                    {course.scheduleSummary || "Schedule TBD"} · {course.seatsRemaining} seat(s) left
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {step === 3 && selectedCourse ? (
        <div className="wizard-stage">
          <h3>{selectedCourse.title} program details</h3>
          <div className="program-detail">
            <div>
              <small>Program</small>
              <strong>{selectedCourse.title}</strong>
            </div>
            <div>
              <small>Term</small>
              <strong>{selectedCourse.termLabel || "TBD"}</strong>
            </div>
            <div>
              <small>Meeting pattern</small>
              <strong>{selectedCourse.scheduleSummary || "Pending confirmation"}</strong>
            </div>
            <div>
              <small>Fees (catalog)</small>
              <strong>
                Reg {selectedCourse.registrationFeeLabel} · Tuition {selectedCourse.tuitionLabel} · Materials{" "}
                {selectedCourse.materialsFeeLabel}
              </strong>
            </div>
          </div>

          {draft.formId === "express" ? (
            <div className="validation-hint persistent">
              Open decision: Express class-time preference is pending client confirmation. No times are offered
              here.
            </div>
          ) : null}
          {draft.formId === "summer_master_class" ? (
            <div className="validation-hint persistent">
              Evidence gate: Summer Master Class agreement mapping remains pending correction; enrollment still
              uses the standard policy acknowledgement.
            </div>
          ) : null}

          {draft.formId === "first_class" ? (
            <div className="select-block">
              <strong>Class time preference</strong>
              <div className="field-choice-row">
                {slotOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={draft.slotPreference[0] === option.id ? "selected" : ""}
                    onClick={() => setDraft({ ...draft, slotPreference: [option.id] })}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {draft.formId === "summer_master_class" ? (
            <div className="select-block">
              <strong>Session preferences</strong>
              <div className="field-choice-row">
                {slotOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={draft.slotPreference.includes(option.id) ? "selected" : ""}
                    onClick={() => toggleMasterSession(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="wizard-stage">
          <h3>Registration and billing preview</h3>
          <p>
            Choose the course-specific plan. Amounts are catalog labels only — no charge is taken in this step.
          </p>
          <div className="choice-grid two">
            {paymentPlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                className={`choice-card${draft.paymentPlanId === plan.id ? " selected" : ""}`}
                onClick={() => setDraft({ ...draft, paymentPlanId: plan.id })}
              >
                <strong>{plan.id === "pay_in_full" ? "Paid in full" : "Monthly plan"}</strong>
                <p>{plan.label}</p>
                <small>Hosted Stripe card on file · No charge</small>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="wizard-stage">
          <h3>Policy and payment method</h3>
          {!stripeConfigured ? (
            <div className="validation-hint">
              Stripe keys are missing. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY to .env.local,
              then restart the server.
            </div>
          ) : null}
          <label className="merge-confirm">
            <input
              type="checkbox"
              checked={draft.policyAck}
              onChange={(event) => setDraft({ ...draft, policyAck: event.target.checked })}
            />
            I acknowledge the course agreement and cancellation policy for this enrollment.
          </label>
          <label className="merge-confirm">
            <input
              type="checkbox"
              checked={draft.paymentMethodConsent}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  paymentMethodConsent: event.target.checked,
                  cardSaved: event.target.checked ? draft.cardSaved : false,
                })
              }
            />
            Save my card with Stripe for this enrollment and future Professional Tutoring charges.
          </label>
          <StripeCardSaver
            consent={draft.paymentMethodConsent}
            savedCard={savedCard}
            onSaved={(card) => {
              setSavedCard(card);
              setDraft((prev) => ({ ...prev, cardSaved: true }));
            }}
            onUseSaved={() => setDraft((prev) => ({ ...prev, cardSaved: true, paymentMethodConsent: true }))}
          />
        </div>
      ) : null}

      {step === 6 ? (
        <div className="wizard-stage">
          <h3>Review enrollment</h3>
          <div className="review-summary">
            <div>
              <small>Student</small>
              <strong>{selectedStudent?.displayName}</strong>
            </div>
            <div>
              <small>Course</small>
              <strong>{selectedCourse?.title}</strong>
            </div>
            <div>
              <small>Term</small>
              <strong>{selectedCourse?.termLabel || "TBD"}</strong>
            </div>
            <div>
              <small>Schedule</small>
              <strong>
                {draft.formId === "express"
                  ? selectedCourse?.scheduleSummary || "Pending confirmation"
                  : draft.slotPreference
                      .map((id) => slotOptions.find((option) => option.id === id)?.label || id)
                      .join("; ") || selectedCourse?.scheduleSummary}
              </strong>
            </div>
            <div>
              <small>Payment plan</small>
              <strong>{selectedPlan?.label}</strong>
            </div>
            <div>
              <small>Card on file</small>
              <strong>
                {(savedCard?.brand || "Card").toUpperCase()} ···· {savedCard?.last4}
              </strong>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <div className="validation-hint">{error}</div> : null}

      <div className="wizard-footer">
        <button
          type="button"
          className="wizard-back"
          onClick={() => {
            if (step === 1) router.push("/family");
            else setStep((value) => value - 1);
          }}
        >
          ← Back
        </button>
        {step < 6 ? (
          <button
            type="button"
            className="family-primary"
            disabled={!stepValid}
            onClick={() => setStep((value) => value + 1)}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="family-primary"
            disabled={!stepValid || saving}
            onClick={() => void confirmEnrollment()}
          >
            {saving ? "Confirming…" : "Confirm enrollment"}
          </button>
        )}
      </div>
    </section>
  );
}
