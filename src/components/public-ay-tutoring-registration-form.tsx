"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AddressAutocompleteInput } from "@/components/address-autocomplete-input";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import { PhoneInput } from "@/components/phone-input";
import {
  ACADEMIC_ADVANCED_RATE_PACKAGES,
  ACADEMIC_PAYMENT_PLANS,
  ACADEMIC_RATE_PACKAGES,
  ACADEMIC_SCHEDULE_WINDOWS,
  ACADEMIC_SUBJECTS,
  ALT_PAYMENT_METHODS,
  GENDER,
  GRADE_LABELS,
  GRADUATION_YEARS,
  REFERRAL_SOURCE,
  TEST_PREP_INTERESTS,
  US_STATES,
  YES_NO,
} from "@/lib/forms/options";
import type { AddressSuggestion } from "@/lib/mapbox/geocode";
import { isValidEmail, isValidPhone } from "@/lib/validation/contact";

const STEPS = [
  "Welcome",
  "Student",
  "Parents & billing",
  "Tutoring needs",
  "Schedule",
  "Plan",
  "Agreement",
  "Review",
] as const;

type Draft = {
  studentFirstName: string;
  studentLastName: string;
  schoolName: string;
  gradeLabel: string;
  graduationYear: string;
  gender: string;
  birthdate: string;
  studentCell: string;
  studentEmail: string;
  studentAddressLine1: string;
  studentCity: string;
  studentState: string;
  studentPostalCode: string;
  supportNotes: string;
  p1FirstName: string;
  p1LastName: string;
  p1Email: string;
  p1Phone: string;
  p2FirstName: string;
  p2LastName: string;
  p2Email: string;
  p2Phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  billingFirstName: string;
  billingLastName: string;
  billingEmail: string;
  billingPhone: string;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  copyFamilyAddressToBilling: boolean;
  subjectCodes: string[];
  subjectNotes: string;
  testPrepInterests: string[];
  referralSource: string;
  schedulingPath: "" | "family_selected" | "pt_chooses";
  preferredWindowIds: string[];
  scheduleNotes: string;
  windowId: string;
  tutorId: string;
  slotId: string;
  paymentPlanId: string;
  hoursRatePackage: string;
  advancedHoursRatePackage: string;
  autoCharge: string;
  altPaymentMethod: string;
  policyAck: boolean;
  agreementAck: boolean;
  parentSignature: string;
  studentSignature: string;
};

const emptyDraft: Draft = {
  studentFirstName: "",
  studentLastName: "",
  schoolName: "",
  gradeLabel: "",
  graduationYear: "",
  gender: "",
  birthdate: "",
  studentCell: "",
  studentEmail: "",
  studentAddressLine1: "",
  studentCity: "",
  studentState: "",
  studentPostalCode: "",
  supportNotes: "",
  p1FirstName: "",
  p1LastName: "",
  p1Email: "",
  p1Phone: "",
  p2FirstName: "",
  p2LastName: "",
  p2Email: "",
  p2Phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  billingFirstName: "",
  billingLastName: "",
  billingEmail: "",
  billingPhone: "",
  billingAddressLine1: "",
  billingAddressLine2: "",
  billingCity: "",
  billingState: "",
  billingPostalCode: "",
  copyFamilyAddressToBilling: true,
  subjectCodes: [],
  subjectNotes: "",
  testPrepInterests: [],
  referralSource: "",
  schedulingPath: "",
  preferredWindowIds: [],
  scheduleNotes: "",
  windowId: "",
  tutorId: "",
  slotId: "",
  paymentPlanId: "",
  hoursRatePackage: "",
  advancedHoursRatePackage: "",
  autoCharge: "",
  altPaymentMethod: "",
  policyAck: false,
  agreementAck: false,
  parentSignature: "",
  studentSignature: "",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type TutorOption = { id: string; displayName: string; openSlots: number };
type SlotOption = {
  id: string;
  label: string | null;
  dayOfWeek: number;
  startTimeLocal: string;
  endTimeLocal: string;
  openSeats: number;
};

function RequiredMark() {
  return (
    <span className="public-ay-req" aria-hidden="true">
      *
    </span>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="public-ay-field">
      <span>
        {label}
        {required ? <RequiredMark /> : null}
      </span>
      {children}
    </label>
  );
}

function AddressFields({
  street,
  city,
  state,
  postalCode,
  required,
  onChange,
}: {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  required?: boolean;
  onChange: (next: { street?: string; city?: string; state?: string; postalCode?: string }) => void;
}) {
  function applySuggestion(suggestion: AddressSuggestion) {
    onChange({
      street: suggestion.addressLine1,
      city: suggestion.city || city,
      state: suggestion.state || state,
      postalCode: suggestion.postalCode || postalCode,
    });
  }

  return (
    <div className="public-ay-grid">
      <Field label="Street" required={required}>
        <AddressAutocompleteInput
          value={street}
          onChange={(value) => onChange({ street: value })}
          onSelect={applySuggestion}
        />
      </Field>
      <Field label="City" required={required}>
        <input value={city} onChange={(event) => onChange({ city: event.target.value })} autoComplete="address-level2" />
      </Field>
      <Field label="State" required={required}>
        <select value={state} onChange={(event) => onChange({ state: event.target.value })} autoComplete="address-level1">
          <option value="">Select</option>
          {US_STATES.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="ZIP" required={required}>
        <input value={postalCode} onChange={(event) => onChange({ postalCode: event.target.value })} autoComplete="postal-code" />
      </Field>
    </div>
  );
}

function filledEmailInvalid(value: string) {
  const trimmed = value.trim();
  return Boolean(trimmed) && !isValidEmail(trimmed);
}

function filledPhoneInvalid(value: string) {
  const trimmed = value.trim();
  return Boolean(trimmed) && !isValidPhone(trimmed);
}

export function PublicAyTutoringRegistrationForm({ title }: { title: string }) {
  const router = useRouter();
  const toast = useAppToast();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [tutors, setTutors] = useState<TutorOption[]>([]);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  const primarySubject = draft.subjectCodes[0] ?? "";

  function patch(next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  function toggleList(key: "subjectCodes" | "testPrepInterests" | "preferredWindowIds", id: string) {
    setDraft((current) => {
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(id) ? list.filter((item) => item !== id) : [...list, id],
      };
    });
  }

  async function loadTutors(windowId: string) {
    if (!primarySubject || !windowId) {
      setTutors([]);
      setSlots([]);
      return;
    }
    setLoadingTimes(true);
    try {
      const response = await fetch(
        `/api/public/ay-tutoring-availability?subjectCode=${encodeURIComponent(primarySubject)}&windowId=${encodeURIComponent(windowId)}`,
      );
      const data = await response.json();
      setTutors(data.tutors ?? []);
      setSlots([]);
    } catch {
      setTutors([]);
      toast.error("Unable to load available tutors. Please try again.");
    } finally {
      setLoadingTimes(false);
    }
  }

  async function loadSlots(tutorId: string, windowId: string) {
    if (!primarySubject || !windowId || !tutorId) {
      setSlots([]);
      return;
    }
    setLoadingTimes(true);
    try {
      const response = await fetch(
        `/api/public/ay-tutoring-availability?subjectCode=${encodeURIComponent(primarySubject)}&windowId=${encodeURIComponent(windowId)}&tutorId=${encodeURIComponent(tutorId)}`,
      );
      const data = await response.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
      toast.error("Unable to load available times. Please try again.");
    } finally {
      setLoadingTimes(false);
    }
  }

  function validateStep() {
    if (step === 1) {
      if (
        !draft.studentFirstName.trim() ||
        !draft.studentLastName.trim() ||
        !draft.schoolName.trim() ||
        !draft.gradeLabel ||
        !draft.graduationYear ||
        !draft.gender ||
        !draft.birthdate
      ) {
        return "Please complete the required student fields, including birthdate.";
      }
      if (!draft.studentCell.trim()) return "Student phone is required.";
      if (!isValidPhone(draft.studentCell)) return "Enter a valid student phone number.";
      if (filledEmailInvalid(draft.studentEmail)) return "Enter a valid student email.";
      if (!draft.studentAddressLine1.trim() || !draft.studentCity.trim() || !draft.studentState || !draft.studentPostalCode.trim()) {
        return "Student address is required.";
      }
    }
    if (step === 2) {
      if (!draft.p1FirstName.trim() || !draft.p1LastName.trim() || !draft.p1Email.trim()) {
        return "Parent 1 name and email are required.";
      }
      if (!isValidEmail(draft.p1Email)) return "Enter a valid Parent 1 email.";
      if (!draft.p1Phone.trim()) return "Parent 1 phone is required.";
      if (!isValidPhone(draft.p1Phone)) return "Enter a valid Parent 1 phone number.";
      if (draft.p2FirstName.trim() || draft.p2LastName.trim() || draft.p2Email.trim() || draft.p2Phone.trim()) {
        if (!draft.p2FirstName.trim() || !draft.p2LastName.trim() || !draft.p2Email.trim()) {
          return "Parent 2 name and email are required when Parent 2 is provided.";
        }
        if (!isValidEmail(draft.p2Email)) return "Enter a valid Parent 2 email.";
        if (filledPhoneInvalid(draft.p2Phone)) return "Enter a valid Parent 2 phone number.";
      }
      if (!draft.addressLine1.trim() || !draft.city.trim() || !draft.state || !draft.postalCode.trim()) {
        return "Family address is required.";
      }
      if (!draft.billingFirstName.trim() || !draft.billingLastName.trim() || !draft.billingEmail.trim()) {
        return "Billing name, email, and address are required.";
      }
      if (!isValidEmail(draft.billingEmail)) return "Enter a valid billing email.";
      if (filledPhoneInvalid(draft.billingPhone)) return "Enter a valid billing phone number.";
      if (
        !draft.copyFamilyAddressToBilling &&
        (!draft.billingAddressLine1.trim() ||
          !draft.billingCity.trim() ||
          !draft.billingState ||
          !draft.billingPostalCode.trim())
      ) {
        return "Billing name, email, and address are required.";
      }
    }
    if (step === 3) {
      if (draft.subjectCodes.length === 0) return "Select at least one subject.";
      if (!draft.referralSource) return "Please tell us how you heard about us.";
    }
    if (step === 4) {
      if (!draft.schedulingPath) return "Choose how you’d like us to schedule.";
      if (draft.schedulingPath === "family_selected" && !draft.slotId) {
        return "Choose a preferred tutor and time, or let Professional Tutoring choose.";
      }
      if (
        draft.schedulingPath === "pt_chooses" &&
        draft.preferredWindowIds.length === 0 &&
        !draft.scheduleNotes.trim()
      ) {
        return "Select at least one preferred time or add a note.";
      }
    }
    if (step === 5 && !draft.paymentPlanId) return "Select a payment plan.";
    if (step === 6) {
      if (!draft.policyAck || !draft.agreementAck) return "Please acknowledge the policy and agreement.";
      if (!draft.parentSignature.trim() || !draft.studentSignature.trim()) {
        return "Parent and student signatures are required.";
      }
    }
    return null;
  }

  function next() {
    const problem = validateStep();
    if (problem) {
      toast.error(problem);
      return;
    }
    setStep((value) => Math.min(value + 1, STEPS.length - 1));
  }

  const selectedTutorName = useMemo(
    () => tutors.find((tutor) => tutor.id === draft.tutorId)?.displayName,
    [tutors, draft.tutorId],
  );
  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === draft.slotId),
    [slots, draft.slotId],
  );

  async function submit() {
    const problem = validateStep();
    if (problem) {
      toast.error(problem);
      return;
    }
    setSaving(true);
    const billingAddress = draft.copyFamilyAddressToBilling
      ? {
          addressLine1: draft.addressLine1,
          addressLine2: draft.addressLine2,
          city: draft.city,
          state: draft.state,
          postalCode: draft.postalCode,
        }
      : {
          addressLine1: draft.billingAddressLine1,
          addressLine2: draft.billingAddressLine2,
          city: draft.billingCity,
          state: draft.billingState,
          postalCode: draft.billingPostalCode,
        };
    try {
      const response = await fetch("/api/public/ay-tutoring-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student: {
            firstName: draft.studentFirstName,
            lastName: draft.studentLastName,
            schoolName: draft.schoolName,
            gradeLabel: draft.gradeLabel,
            graduationYear: draft.graduationYear,
            gender: draft.gender,
            birthdate: draft.birthdate,
            cellPhone: draft.studentCell,
            email: draft.studentEmail,
            supportNotes: draft.supportNotes,
            addressLine1: draft.studentAddressLine1,
            city: draft.studentCity,
            state: draft.studentState,
            postalCode: draft.studentPostalCode,
          },
          parent1: {
            firstName: draft.p1FirstName,
            lastName: draft.p1LastName,
            email: draft.p1Email,
            phone: draft.p1Phone,
          },
          parent2:
            draft.p2FirstName || draft.p2LastName || draft.p2Email
              ? {
                  firstName: draft.p2FirstName,
                  lastName: draft.p2LastName,
                  email: draft.p2Email,
                  phone: draft.p2Phone,
                }
              : null,
          householdAddress: {
            addressLine1: draft.addressLine1,
            addressLine2: draft.addressLine2,
            city: draft.city,
            state: draft.state,
            postalCode: draft.postalCode,
          },
          billing: {
            firstName: draft.billingFirstName,
            lastName: draft.billingLastName,
            email: draft.billingEmail,
            phone: draft.billingPhone,
            ...billingAddress,
          },
          subjectCodes: draft.subjectCodes,
          subjectNotes: draft.subjectNotes,
          testPrepInterests: draft.testPrepInterests,
          referralSource: draft.referralSource,
          schedulingPath: draft.schedulingPath,
          preferredWindowIds: draft.preferredWindowIds,
          scheduleNotes: draft.scheduleNotes,
          tutorId: draft.tutorId,
          slotId: draft.slotId,
          windowId: draft.windowId,
          paymentPlanId: draft.paymentPlanId,
          hoursRatePackage: draft.hoursRatePackage,
          advancedHoursRatePackage: draft.advancedHoursRatePackage,
          autoCharge: draft.autoCharge,
          altPaymentMethod: draft.altPaymentMethod,
          policyAck: draft.policyAck,
          agreementAck: draft.agreementAck,
          parentSignature: draft.parentSignature,
          studentSignature: draft.studentSignature,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        if (response.status === 409 && data.code === "slot_unavailable") {
          setStep(4);
        }
        toast.error(data.error || "Unable to submit.");
        return;
      }
      sessionStorage.setItem(
        "ayTutoringConfirmation",
        JSON.stringify({
          message: data.message,
          schedulingPath: data.schedulingPath,
          invitePaths: data.invitePaths,
        }),
      );
      toast.success("Registration submitted.");
      router.push("/register/academic-year-tutoring/confirmation");
    } catch {
      toast.error("Unable to submit. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="public-ay-card">
      <AppToastHost toasts={toast.toasts} onDismiss={toast.dismiss} />
      <p className="public-ay-kicker">{title}</p>
      <h1>{STEPS[step]}</h1>
      <ol className="public-ay-steps" aria-label="Registration steps">
        {STEPS.map((label, index) => (
          <li key={label} className={index === step ? "is-current" : index < step ? "is-done" : undefined}>
            {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="public-ay-copy">
          <p>Register for Academic Year Tutoring. We’ll save your information and invite you to the family portal.</p>
          <p>You will not be charged today.</p>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="public-ay-stack">
          <div className="public-ay-grid">
            <Field label="Student first name" required>
              <input value={draft.studentFirstName} onChange={(event) => patch({ studentFirstName: event.target.value })} />
            </Field>
            <Field label="Student last name" required>
              <input value={draft.studentLastName} onChange={(event) => patch({ studentLastName: event.target.value })} />
            </Field>
            <Field label="School" required>
              <input value={draft.schoolName} onChange={(event) => patch({ schoolName: event.target.value })} />
            </Field>
            <Field label="Grade" required>
              <select value={draft.gradeLabel} onChange={(event) => patch({ gradeLabel: event.target.value })}>
                <option value="">Select</option>
                {GRADE_LABELS.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Graduation year" required>
              <select value={draft.graduationYear} onChange={(event) => patch({ graduationYear: event.target.value })}>
                <option value="">Select</option>
                {GRADUATION_YEARS.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Gender" required>
              <select value={draft.gender} onChange={(event) => patch({ gender: event.target.value })}>
                <option value="">Select</option>
                {GENDER.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Birthdate" required>
              <input type="date" value={draft.birthdate} onChange={(event) => patch({ birthdate: event.target.value })} />
            </Field>
            <Field label="Student cell" required>
              <PhoneInput value={draft.studentCell} onChange={(studentCell) => patch({ studentCell })} autoComplete="tel" />
            </Field>
            <Field label="Student email">
              <input
                type="email"
                value={draft.studentEmail}
                onChange={(event) => patch({ studentEmail: event.target.value })}
                autoComplete="email"
              />
            </Field>
          </div>
          <h2>
            Student address
            <RequiredMark />
          </h2>
          <AddressFields
            street={draft.studentAddressLine1}
            city={draft.studentCity}
            state={draft.studentState}
            postalCode={draft.studentPostalCode}
            required
            onChange={(next) =>
              patch({
                ...(next.street !== undefined ? { studentAddressLine1: next.street } : {}),
                ...(next.city !== undefined ? { studentCity: next.city } : {}),
                ...(next.state !== undefined ? { studentState: next.state } : {}),
                ...(next.postalCode !== undefined ? { studentPostalCode: next.postalCode } : {}),
              })
            }
          />
          <label className="public-ay-field">
            <span>504 / IEP / testing accommodations (optional)</span>
            <textarea
              value={draft.supportNotes}
              onChange={(event) => patch({ supportNotes: event.target.value })}
              rows={4}
            />
          </label>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="public-ay-stack">
          <h2>Parent 1</h2>
          <div className="public-ay-grid">
            <Field label="First name" required>
              <input value={draft.p1FirstName} onChange={(event) => patch({ p1FirstName: event.target.value })} />
            </Field>
            <Field label="Last name" required>
              <input value={draft.p1LastName} onChange={(event) => patch({ p1LastName: event.target.value })} />
            </Field>
            <Field label="Email" required>
              <input type="email" value={draft.p1Email} onChange={(event) => patch({ p1Email: event.target.value })} autoComplete="email" />
            </Field>
            <Field label="Phone" required>
              <PhoneInput value={draft.p1Phone} onChange={(p1Phone) => patch({ p1Phone })} />
            </Field>
          </div>
          <h2>Parent 2 (optional)</h2>
          <div className="public-ay-grid">
            <Field label="First name">
              <input value={draft.p2FirstName} onChange={(event) => patch({ p2FirstName: event.target.value })} />
            </Field>
            <Field label="Last name">
              <input value={draft.p2LastName} onChange={(event) => patch({ p2LastName: event.target.value })} />
            </Field>
            <Field label="Email">
              <input type="email" value={draft.p2Email} onChange={(event) => patch({ p2Email: event.target.value })} autoComplete="email" />
            </Field>
            <Field label="Phone">
              <PhoneInput value={draft.p2Phone} onChange={(p2Phone) => patch({ p2Phone })} />
            </Field>
          </div>
          <h2>
            Family address
            <RequiredMark />
          </h2>
          <AddressFields
            street={draft.addressLine1}
            city={draft.city}
            state={draft.state}
            postalCode={draft.postalCode}
            required
            onChange={(next) =>
              patch({
                ...(next.street !== undefined ? { addressLine1: next.street } : {}),
                ...(next.city !== undefined ? { city: next.city } : {}),
                ...(next.state !== undefined ? { state: next.state } : {}),
                ...(next.postalCode !== undefined ? { postalCode: next.postalCode } : {}),
              })
            }
          />
          <h2>Billing information</h2>
          <p className="public-ay-help">Who should we bill? This can be different from Parent 1 or Parent 2.</p>
          <div className="public-ay-grid">
            <Field label="Billing first name" required>
              <input value={draft.billingFirstName} onChange={(event) => patch({ billingFirstName: event.target.value })} />
            </Field>
            <Field label="Billing last name" required>
              <input value={draft.billingLastName} onChange={(event) => patch({ billingLastName: event.target.value })} />
            </Field>
            <Field label="Billing email" required>
              <input
                type="email"
                value={draft.billingEmail}
                onChange={(event) => patch({ billingEmail: event.target.value })}
                autoComplete="email"
              />
            </Field>
            <Field label="Billing phone">
              <PhoneInput value={draft.billingPhone} onChange={(billingPhone) => patch({ billingPhone })} />
            </Field>
          </div>
          <label className="public-ay-check">
            <input
              type="checkbox"
              checked={draft.copyFamilyAddressToBilling}
              onChange={(event) => patch({ copyFamilyAddressToBilling: event.target.checked })}
            />
            Same as family address
          </label>
          {!draft.copyFamilyAddressToBilling ? (
            <AddressFields
              street={draft.billingAddressLine1}
              city={draft.billingCity}
              state={draft.billingState}
              postalCode={draft.billingPostalCode}
              required
              onChange={(next) =>
                patch({
                  ...(next.street !== undefined ? { billingAddressLine1: next.street } : {}),
                  ...(next.city !== undefined ? { billingCity: next.city } : {}),
                  ...(next.state !== undefined ? { billingState: next.state } : {}),
                  ...(next.postalCode !== undefined ? { billingPostalCode: next.postalCode } : {}),
                })
              }
            />
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="public-ay-stack">
          <p>
            Select every subject that applies.
            <RequiredMark /> We’ll use the first checked subject to look for tutors.
          </p>
          <div className="public-ay-checks">
            {ACADEMIC_SUBJECTS.options.map((option) => (
              <label key={option.id} className="public-ay-check">
                <input
                  type="checkbox"
                  checked={draft.subjectCodes.includes(option.id)}
                  onChange={() => toggleList("subjectCodes", option.id)}
                />
                {option.label}
              </label>
            ))}
          </div>
          <label className="public-ay-field">
            <span>Notes (optional)</span>
            <textarea value={draft.subjectNotes} onChange={(event) => patch({ subjectNotes: event.target.value })} rows={3} />
          </label>
          <h2>Test prep (optional)</h2>
          <div className="public-ay-checks">
            {TEST_PREP_INTERESTS.options.map((option) => (
              <label key={option.id} className="public-ay-check">
                <input
                  type="checkbox"
                  checked={draft.testPrepInterests.includes(option.id)}
                  onChange={() => toggleList("testPrepInterests", option.id)}
                />
                {option.label}
              </label>
            ))}
          </div>
          <Field label="How did you hear about us?" required>
            <select value={draft.referralSource} onChange={(event) => patch({ referralSource: event.target.value })}>
              <option value="">Select</option>
              {REFERRAL_SOURCE.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="public-ay-stack">
          <div className="public-ay-choices">
            <button
              type="button"
              className={draft.schedulingPath === "family_selected" ? "is-selected" : undefined}
              onClick={() => patch({ schedulingPath: "family_selected" })}
            >
              Choose a tutor and time
            </button>
            <button
              type="button"
              className={draft.schedulingPath === "pt_chooses" ? "is-selected" : undefined}
              onClick={() => patch({ schedulingPath: "pt_chooses", tutorId: "", slotId: "", windowId: "" })}
            >
              Let Professional Tutoring choose my tutor
            </button>
          </div>
          {draft.schedulingPath === "family_selected" ? (
            <>
              <p className="public-ay-help">
                We’ll save your preferred time. Your place is confirmed after payment in a later step. This does not
                hold a seat.
              </p>
              <Field label="Preferred day and time" required>
                <select
                  value={draft.windowId}
                  onChange={(event) => {
                    const windowId = event.target.value;
                    patch({ windowId, tutorId: "", slotId: "" });
                    void loadTutors(windowId);
                  }}
                >
                  <option value="">Select</option>
                  {ACADEMIC_SCHEDULE_WINDOWS.options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              {loadingTimes ? <p>Loading available tutors…</p> : null}
              {draft.windowId && tutors.length === 0 && !loadingTimes ? (
                <p>
                  No open times for that window. Choose another window, or let Professional Tutoring choose a tutor.
                </p>
              ) : null}
              {tutors.length > 0 ? (
                <div className="public-ay-choices public-ay-choices-list">
                  {tutors.map((tutor) => (
                    <button
                      key={tutor.id}
                      type="button"
                      className={draft.tutorId === tutor.id ? "is-selected" : undefined}
                      onClick={() => {
                        patch({ tutorId: tutor.id, slotId: "" });
                        void loadSlots(tutor.id, draft.windowId);
                      }}
                    >
                      {tutor.displayName}
                      <small>{tutor.openSlots} open time{tutor.openSlots === 1 ? "" : "s"}</small>
                    </button>
                  ))}
                </div>
              ) : null}
              {slots.length > 0 ? (
                <div className="public-ay-choices public-ay-choices-list">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      className={draft.slotId === slot.id ? "is-selected" : undefined}
                      disabled={slot.openSeats < 1}
                      onClick={() => patch({ slotId: slot.id })}
                    >
                      {DAY_NAMES[slot.dayOfWeek]} {slot.startTimeLocal}–{slot.endTimeLocal}
                      <small>{slot.openSeats < 1 ? "Full" : `${slot.openSeats} remaining — preferred, not confirmed`}</small>
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
          {draft.schedulingPath === "pt_chooses" ? (
            <>
              <p className="public-ay-help">We’ll match a tutor and time. You’ll hear from Professional Tutoring.</p>
              <div className="public-ay-checks">
                {ACADEMIC_SCHEDULE_WINDOWS.options.map((option) => (
                  <label key={option.id} className="public-ay-check">
                    <input
                      type="checkbox"
                      checked={draft.preferredWindowIds.includes(option.id)}
                      onChange={() => toggleList("preferredWindowIds", option.id)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <label className="public-ay-field">
                <span>Schedule notes (optional)</span>
                <textarea
                  value={draft.scheduleNotes}
                  onChange={(event) => patch({ scheduleNotes: event.target.value })}
                  rows={3}
                />
              </label>
            </>
          ) : null}
        </div>
      ) : null}

      {step === 5 ? (
        <div className="public-ay-stack">
          <p>These are billing preferences only. You will not be charged today, and we are not collecting a card.</p>
          <Field label="Payment plan" required>
            <select value={draft.paymentPlanId} onChange={(event) => patch({ paymentPlanId: event.target.value })}>
              <option value="">Select</option>
              {ACADEMIC_PAYMENT_PLANS.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Hours / rates (standard, optional)">
            <select value={draft.hoursRatePackage} onChange={(event) => patch({ hoursRatePackage: event.target.value })}>
              <option value="">Select</option>
              {ACADEMIC_RATE_PACKAGES.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Hours / rates (advanced, optional)">
            <select
              value={draft.advancedHoursRatePackage}
              onChange={(event) => patch({ advancedHoursRatePackage: event.target.value })}
            >
              <option value="">Select</option>
              {ACADEMIC_ADVANCED_RATE_PACKAGES.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Automatically charge a card for monthly payments? (optional)">
            <select value={draft.autoCharge} onChange={(event) => patch({ autoCharge: event.target.value })}>
              <option value="">Select</option>
              {YES_NO.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Alternative form of payment (optional)">
            <select value={draft.altPaymentMethod} onChange={(event) => patch({ altPaymentMethod: event.target.value })}>
              <option value="">Select</option>
              {ALT_PAYMENT_METHODS.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}

      {step === 6 ? (
        <div className="public-ay-stack">
          <label className="public-ay-check">
            <input
              type="checkbox"
              checked={draft.policyAck}
              onChange={(event) => patch({ policyAck: event.target.checked })}
            />
            <span>
              I acknowledge the tutoring policy and course information.
              <RequiredMark />
            </span>
          </label>
          <label className="public-ay-check">
            <input
              type="checkbox"
              checked={draft.agreementAck}
              onChange={(event) => patch({ agreementAck: event.target.checked })}
            />
            <span>
              I agree to the terms outlined in this agreement.
              <RequiredMark />
            </span>
          </label>
          <Field label="Parent signature (type your full name)" required>
            <input value={draft.parentSignature} onChange={(event) => patch({ parentSignature: event.target.value })} />
          </Field>
          <Field label="Student signature (type full name)" required>
            <input value={draft.studentSignature} onChange={(event) => patch({ studentSignature: event.target.value })} />
          </Field>
        </div>
      ) : null}

      {step === 7 ? (
        <div className="public-ay-stack">
          <p>
            {draft.studentFirstName} {draft.studentLastName} · {draft.schoolName}
          </p>
          <p>
            Parent 1: {draft.p1FirstName} {draft.p1LastName}
          </p>
          <p>
            Bill to: {draft.billingFirstName} {draft.billingLastName} ({draft.billingEmail})
          </p>
          <p>
            {draft.schedulingPath === "family_selected"
              ? `Preferred tutor/time: ${selectedTutorName ?? "Selected tutor"}${selectedSlot ? ` · ${DAY_NAMES[selectedSlot.dayOfWeek]} ${selectedSlot.startTimeLocal}` : ""}. Not a confirmed seat.`
              : "Professional Tutoring will choose a tutor and time."}
          </p>
          <p>You will not be charged today.</p>
        </div>
      ) : null}

      <div className="public-ay-actions">
        {step > 0 ? (
          <button type="button" className="public-ay-secondary" onClick={() => setStep((value) => value - 1)}>
            Back
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" className="public-ay-primary" onClick={next}>
            {step === 0 ? "Start registration" : "Continue"}
          </button>
        ) : (
          <button type="button" className="public-ay-primary" onClick={() => void submit()} disabled={saving}>
            {saving ? "Submitting…" : "Submit registration"}
          </button>
        )}
      </div>
    </div>
  );
}
