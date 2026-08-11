"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  StripeCardSaver,
  type CollectedCard,
  type StripeCardSaverHandle,
} from "@/components/stripe-card-saver";

type Option = { id: string; label: string };
type Student = { id: string; displayName: string; gradeLabel: string | null; schoolName: string | null };
type Tutor = { id: string; displayName: string; notes: string | null; openSlots: number };
type Slot = {
  id: string;
  label: string | null;
  dayOfWeek: number;
  startTimeLocal: string;
  endTimeLocal: string;
  openSeats: number;
};
type SavedCard = { brand: string | null; last4: string | null };

type Draft = {
  studentId: string;
  formId: "academic_year_tutoring" | "summer_tutoring" | "";
  subjectCode: string;
  subjectNotes: string;
  windowId: string;
  summerDateRange: string;
  scheduleNotes: string;
  tutorId: string;
  slotId: string;
  paymentPlanId: string;
  policyAck: boolean;
  /** Opt-in to store card on household for future charges. */
  saveCardForFuture: boolean;
  /** Card confirmed for this booking (collected or existing on-file). */
  cardReady: boolean;
  paymentMethodId: string | null;
};

const steps = ["Student", "Service", "Plan", "Tutor", "Slot", "Policy", "Review"];

const emptyDraft: Draft = {
  studentId: "",
  formId: "",
  subjectCode: "",
  subjectNotes: "",
  windowId: "",
  summerDateRange: "",
  scheduleNotes: "",
  tutorId: "",
  slotId: "",
  paymentPlanId: "",
  policyAck: false,
  saveCardForFuture: false,
  cardReady: false,
  paymentMethodId: null,
};

export function BookTutoringWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cardRef = useRef<StripeCardSaverHandle>(null);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [academicWindows, setAcademicWindows] = useState<Option[]>([]);
  const [summerWindows, setSummerWindows] = useState<Option[]>([]);
  const [academicPlans, setAcademicPlans] = useState<Option[]>([]);
  const [summerPlans, setSummerPlans] = useState<Option[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null);
  const [displayCard, setDisplayCard] = useState<SavedCard | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState(true);
  const [householdStatus, setHouseholdStatus] = useState<string>("pending");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmingCard, setConfirmingCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    tutorName: string;
    studentName: string;
    serviceTitle: string;
    savedForFuture: boolean;
  } | null>(null);

  const windows = draft.formId === "summer_tutoring" ? summerWindows : academicWindows;
  const paymentPlans = draft.formId === "summer_tutoring" ? summerPlans : academicPlans;

  const selectedStudent = students.find((s) => s.id === draft.studentId);
  const selectedSubject = subjects.find((s) => s.id === draft.subjectCode);
  const selectedWindow = windows.find((w) => w.id === draft.windowId);
  const selectedTutor = tutors.find((t) => t.id === draft.tutorId);
  const selectedSlot = slots.find((s) => s.id === draft.slotId);
  const selectedPlan = paymentPlans.find((p) => p.id === draft.paymentPlanId);

  useEffect(() => {
    const presetStudent = searchParams.get("studentId");
    void (async () => {
      try {
        const response = await fetch("/api/family/book-tutoring/options");
        const data = await response.json();
        if (!response.ok || !data.ok) {
          setError(data.error || "Unable to load booking options.");
          return;
        }
        setStudents(data.students ?? []);
        setSubjects(data.subjects ?? []);
        setAcademicWindows(data.academicWindows ?? []);
        setSummerWindows(data.summerWindows ?? []);
        setAcademicPlans(data.academicPaymentPlans ?? []);
        setSummerPlans(data.summerPaymentPlans ?? []);
        setStripeConfigured(Boolean(data.stripeConfigured));
        setHouseholdStatus(data.householdStatus);
        if (data.savedCard?.last4) {
          const card = { brand: data.savedCard.brand, last4: data.savedCard.last4 };
          setSavedCard(card);
          setDisplayCard(card);
          setDraft((prev) => ({
            ...prev,
            cardReady: true,
            paymentMethodId: null,
            saveCardForFuture: Boolean(data.savedCard.consentAt),
          }));
        }
        if (presetStudent && (data.students ?? []).some((s: Student) => s.id === presetStudent)) {
          setDraft((prev) => ({ ...prev, studentId: presetStudent }));
          setStep(2);
        }
      } catch {
        setError("Unable to load booking options.");
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  useEffect(() => {
    if (!draft.subjectCode || !draft.windowId) {
      setTutors([]);
      return;
    }
    void (async () => {
      const params = new URLSearchParams({
        subjectCode: draft.subjectCode,
        windowId: draft.windowId,
      });
      const response = await fetch(`/api/family/book-tutoring/options?${params}`);
      const data = await response.json();
      if (response.ok && data.ok) setTutors(data.tutors ?? []);
    })();
  }, [draft.subjectCode, draft.windowId]);

  useEffect(() => {
    if (!draft.subjectCode || !draft.windowId || !draft.tutorId) {
      setSlots([]);
      return;
    }
    void (async () => {
      const params = new URLSearchParams({
        subjectCode: draft.subjectCode,
        windowId: draft.windowId,
        tutorId: draft.tutorId,
      });
      const response = await fetch(`/api/family/book-tutoring/options?${params}`);
      const data = await response.json();
      if (response.ok && data.ok) setSlots(data.slots ?? []);
    })();
  }, [draft.subjectCode, draft.windowId, draft.tutorId]);

  const stepValid = useMemo(() => {
    if (step === 1) return Boolean(draft.studentId);
    if (step === 2) return Boolean(draft.formId);
    if (step === 3) {
      if (!draft.subjectCode || !draft.windowId) return false;
      if (draft.formId === "summer_tutoring" && !draft.summerDateRange.trim()) return false;
      return true;
    }
    if (step === 4) return Boolean(draft.tutorId);
    if (step === 5) return Boolean(draft.slotId);
    if (step === 6) {
      return Boolean(draft.paymentPlanId && draft.policyAck && stripeConfigured);
    }
    return true;
  }, [draft, step, stripeConfigured]);

  function applyCollectedCard(card: CollectedCard) {
    setDisplayCard({ brand: card.brand, last4: card.last4 });
    if (card.savedForFuture && card.last4) {
      setSavedCard({ brand: card.brand, last4: card.last4 });
    }
    setDraft((prev) => ({
      ...prev,
      cardReady: true,
      paymentMethodId: card.id,
      saveCardForFuture: card.savedForFuture ? true : prev.saveCardForFuture,
    }));
  }

  async function handleContinue() {
    if (step !== 6) {
      setStep((value) => value + 1);
      return;
    }
    if (draft.cardReady) {
      setStep(7);
      return;
    }
    setConfirmingCard(true);
    setError(null);
    try {
      const collected = await cardRef.current?.confirm();
      if (!collected) return;
      applyCollectedCard(collected);
      setStep(7);
    } catch {
      setError("Unable to confirm card.");
    } finally {
      setConfirmingCard(false);
    }
  }

  async function confirmBooking() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/family/book-tutoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: draft.studentId,
          formId: draft.formId,
          subjectCode: draft.subjectCode,
          subjectNotes: draft.subjectNotes,
          windowId: draft.windowId,
          summerDateRange: draft.summerDateRange,
          scheduleNotes: draft.scheduleNotes,
          tutorId: draft.tutorId,
          slotId: draft.slotId,
          paymentPlanId: draft.paymentPlanId,
          policyAck: draft.policyAck,
          saveCardForFuture: draft.saveCardForFuture,
          paymentMethodId: draft.paymentMethodId || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to confirm booking.");
        return;
      }
      setConfirmed({
        tutorName: data.booking.tutorName,
        studentName: data.booking.studentName,
        serviceTitle: data.booking.serviceTitle,
        savedForFuture: draft.saveCardForFuture || Boolean(savedCard?.last4 && !draft.paymentMethodId),
      });
      setStep(8);
    } catch {
      setError("Unable to confirm booking.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="panel">Loading booking options…</div>;
  }

  if (householdStatus !== "active") {
    return (
      <div className="panel">
        <h3>Onboarding required</h3>
        <p>Complete your family profile before booking tutoring.</p>
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
        <p>Book Tutoring needs at least one student on the household.</p>
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
        <h3>Booking submitted</h3>
        <p>
          {confirmed.serviceTitle} for {confirmed.studentName} with {confirmed.tutorName} is saved as pending
          payment.
          {confirmed.savedForFuture
            ? " Your card was saved on file with Stripe for future charges."
            : " Card details were confirmed for this booking only and were not saved for future charges."}
        </p>
        <div className="success-actions">
          <button type="button" className="family-primary" onClick={() => router.push("/family")}>
            Back to home
          </button>
          <button type="button" className="secondary-button" onClick={() => router.push("/family/payments")}>
            View payments
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="wizard-shell panel">
      <div className="wizard-progress">
        {steps.map((label, index) => (
          <div key={label} className={index + 1 < step ? "complete" : index + 1 === step ? "complete" : undefined}>
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
          <h3>Tutoring service</h3>
          <div className="choice-grid two">
            <button
              type="button"
              className={`choice-card${draft.formId === "academic_year_tutoring" ? " selected" : ""}`}
              onClick={() =>
                setDraft({
                  ...draft,
                  formId: "academic_year_tutoring",
                  windowId: "",
                  paymentPlanId: "",
                })
              }
            >
              <strong>Academic-Year Tutoring</strong>
              <p>School-year subject support with weekly windows.</p>
            </button>
            <button
              type="button"
              className={`choice-card${draft.formId === "summer_tutoring" ? " selected" : ""}`}
              onClick={() =>
                setDraft({
                  ...draft,
                  formId: "summer_tutoring",
                  windowId: "",
                  paymentPlanId: "",
                })
              }
            >
              <strong>Summer Tutoring</strong>
              <p>Summer subject support with summer schedule windows.</p>
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="wizard-stage">
          <h3>Subject and schedule window</h3>
          <div className="input-grid">
            <label>
              Subject
              <select
                value={draft.subjectCode}
                onChange={(event) =>
                  setDraft({ ...draft, subjectCode: event.target.value, tutorId: "", slotId: "" })
                }
              >
                <option value="">Select subject</option>
                {subjects.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Schedule window
              <select
                value={draft.windowId}
                onChange={(event) =>
                  setDraft({ ...draft, windowId: event.target.value, tutorId: "", slotId: "" })
                }
              >
                <option value="">Select window</option>
                {windows.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {draft.formId === "summer_tutoring" ? (
              <label>
                Summer date range
                <input
                  value={draft.summerDateRange}
                  onChange={(event) => setDraft({ ...draft, summerDateRange: event.target.value })}
                  placeholder="e.g. June 15 – August 10"
                />
              </label>
            ) : null}
            <label className="full-input" style={{ gridColumn: "1 / -1" }}>
              Subject notes
              <textarea
                value={draft.subjectNotes}
                onChange={(event) => setDraft({ ...draft, subjectNotes: event.target.value })}
                placeholder="Optional goals or focus areas"
              />
            </label>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="wizard-stage">
          <h3>Available tutors</h3>
          {tutors.length === 0 ? (
            <div className="validation-hint">No tutors have open capacity for this subject and window.</div>
          ) : (
            <div className="choice-grid two">
              {tutors.map((tutor) => (
                <button
                  key={tutor.id}
                  type="button"
                  className={`choice-card${draft.tutorId === tutor.id ? " selected" : ""}`}
                  onClick={() => setDraft({ ...draft, tutorId: tutor.id, slotId: "" })}
                >
                  <strong>{tutor.displayName}</strong>
                  <p>{tutor.notes || "Available for this request."}</p>
                  <small>{tutor.openSlots} open slot(s)</small>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {step === 5 ? (
        <div className="wizard-stage">
          <h3>Confirmed slot</h3>
          {slots.length === 0 ? (
            <div className="validation-hint">No open seats remain for this tutor and window.</div>
          ) : (
            <div className="choice-grid two">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  className={`choice-card${draft.slotId === slot.id ? " selected" : ""}`}
                  onClick={() => setDraft({ ...draft, slotId: slot.id })}
                >
                  <strong>{slot.label || `${slot.startTimeLocal}–${slot.endTimeLocal}`}</strong>
                  <p>
                    {slot.startTimeLocal} – {slot.endTimeLocal}
                  </p>
                  <small>{slot.openSeats} seat(s) open</small>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {step === 6 ? (
        <div className="wizard-stage">
          <h3>Policy and payment method</h3>
          {!stripeConfigured ? (
            <div className="validation-hint">
              Stripe keys are missing. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY to .env.local,
              then restart the server.
            </div>
          ) : null}
          <div className="input-grid">
            <label style={{ gridColumn: "1 / -1" }}>
              Payment plan
              <select
                value={draft.paymentPlanId}
                onChange={(event) => setDraft({ ...draft, paymentPlanId: event.target.value })}
              >
                <option value="">Select plan</option>
                {paymentPlans.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="merge-confirm">
            <input
              type="checkbox"
              checked={draft.policyAck}
              onChange={(event) => setDraft({ ...draft, policyAck: event.target.checked })}
            />
            I acknowledge the tutoring agreement and cancellation policy for this booking.
          </label>
          <StripeCardSaver
            ref={cardRef}
            saveForFuture={draft.saveCardForFuture}
            savedCard={savedCard}
            onCollected={applyCollectedCard}
            onUseSaved={() => {
              setDisplayCard(savedCard);
              setDraft((prev) => ({
                ...prev,
                cardReady: true,
                paymentMethodId: null,
                saveCardForFuture: true,
              }));
            }}
            onStartReplace={() =>
              setDraft((prev) => ({
                ...prev,
                cardReady: false,
                paymentMethodId: null,
              }))
            }
          />
          <label className="merge-confirm">
            <input
              type="checkbox"
              checked={draft.saveCardForFuture}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  saveCardForFuture: event.target.checked,
                })
              }
            />
            Save this card for future Professional Tutoring charges.
          </label>
        </div>
      ) : null}

      {step === 7 ? (
        <div className="wizard-stage">
          <h3>Review booking</h3>
          <div className="review-summary">
            <div>
              <small>Student</small>
              <strong>{selectedStudent?.displayName}</strong>
            </div>
            <div>
              <small>Service</small>
              <strong>
                {draft.formId === "summer_tutoring" ? "Summer Tutoring" : "Academic-Year Tutoring"}
              </strong>
            </div>
            <div>
              <small>Subject</small>
              <strong>{selectedSubject?.label}</strong>
            </div>
            <div>
              <small>Window</small>
              <strong>{selectedWindow?.label}</strong>
            </div>
            <div>
              <small>Tutor</small>
              <strong>{selectedTutor?.displayName}</strong>
            </div>
            <div>
              <small>Slot</small>
              <strong>{selectedSlot?.label || selectedSlot?.startTimeLocal}</strong>
            </div>
            <div>
              <small>Payment plan</small>
              <strong>{selectedPlan?.label}</strong>
            </div>
            <div>
              <small>Card for this booking</small>
              <strong>
                {displayCard?.last4
                  ? `${(displayCard.brand || "Card").toUpperCase()} ···· ${displayCard.last4}`
                  : "Pending confirmation"}
              </strong>
            </div>
            <div>
              <small>Save for future</small>
              <strong>{draft.saveCardForFuture || (savedCard?.last4 && !draft.paymentMethodId) ? "Yes" : "No"}</strong>
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
        {step < 7 ? (
          <button
            type="button"
            className="family-primary"
            disabled={!stepValid || confirmingCard}
            onClick={() => void handleContinue()}
          >
            {confirmingCard ? "Confirming card…" : "Continue"}
          </button>
        ) : (
          <button
            type="button"
            className="family-primary"
            disabled={!stepValid || saving}
            onClick={() => void confirmBooking()}
          >
            {saving ? "Confirming…" : "Confirm booking"}
          </button>
        )}
      </div>
    </section>
  );
}
