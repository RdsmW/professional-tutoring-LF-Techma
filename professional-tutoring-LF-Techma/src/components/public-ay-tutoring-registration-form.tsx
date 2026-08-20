"use client";

import { cloneElement, createContext, isValidElement, useContext, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AddressAutocompleteInput } from "@/components/address-autocomplete-input";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import { PhoneInput } from "@/components/phone-input";
import { PublicAyTutoringPaymentPanel } from "@/components/public-ay-tutoring-payment-panel";
import {
  ACADEMIC_ADVANCED_RATE_PACKAGES,
  ACADEMIC_PAYMENT_PLANS,
  ACADEMIC_RATE_PACKAGES,
  ACADEMIC_SCHEDULE_WINDOWS,
  ACADEMIC_SUBJECTS,
  GENDER,
  GRADE_LABELS,
  GRADUATION_YEARS,
  REFERRAL_SOURCE,
  TEST_PREP_INTERESTS,
  US_STATES,
} from "@/lib/forms/options";
import type { PublicFormContent } from "@/lib/forms/public-form-schema";
import type { AddressSuggestion } from "@/lib/mapbox/geocode";
import { formatTimeRange12h } from "@/lib/ui/datetime";
import { isValidEmail, isValidPhone } from "@/lib/validation/contact";
import {
  ACADEMIC_YEAR_ACKNOWLEDGEMENTS_RELEASE,
  ACADEMIC_YEAR_PAYMENT_TERMS,
  ACADEMIC_YEAR_POLICY_SECTIONS,
} from "@/lib/academic-year/source-content";
import {
  buildAcademicYearReviewInstallments,
  formatReviewCurrency,
} from "@/lib/academic-year/client-review-quote";
import {
  academicSubjectLabel,
  academicSubjectRateProfile,
  requiresAcademicYearStaffReview,
} from "@/lib/academic-year/subject-pricing";

const STEPS = [
  "Welcome",
  "Student",
  "Parents & billing information",
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
  otherInformation: string;
  p1FirstName: string;
  p1LastName: string;
  p1Email: string;
  p1Phone: string;
  p2FirstName: string;
  p2LastName: string;
  p2Email: string;
  p2Phone: string;
  p1SameAsStudentAddress: boolean;
  p1AddressLine1: string;
  p1City: string;
  p1State: string;
  p1PostalCode: string;
  p2SameAsStudentAddress: boolean;
  p2AddressLine1: string;
  p2City: string;
  p2State: string;
  p2PostalCode: string;
  billingFirstName: string;
  billingLastName: string;
  billingEmail: string;
  billingPhone: string;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  copyStudentAddressToBilling: boolean;
  subjectCodes: string[];
  primarySubjectCode: string;
  otherSubject: string;
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
  otherInformation: "",
  p1FirstName: "",
  p1LastName: "",
  p1Email: "",
  p1Phone: "",
  p2FirstName: "",
  p2LastName: "",
  p2Email: "",
  p2Phone: "",
  p1SameAsStudentAddress: false,
  p1AddressLine1: "",
  p1City: "",
  p1State: "",
  p1PostalCode: "",
  p2SameAsStudentAddress: false,
  p2AddressLine1: "",
  p2City: "",
  p2State: "",
  p2PostalCode: "",
  billingFirstName: "",
  billingLastName: "",
  billingEmail: "",
  billingPhone: "",
  billingAddressLine1: "",
  billingAddressLine2: "",
  billingCity: "",
  billingState: "",
  billingPostalCode: "",
  copyStudentAddressToBilling: true,
  subjectCodes: [],
  primarySubjectCode: "",
  otherSubject: "",
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
  policyAck: false,
  agreementAck: false,
  parentSignature: "",
  studentSignature: "",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PENDING_PAYMENT_STORAGE_KEY = "ayTutoringPendingPayment";
const CONFIRMATION_STORAGE_KEY = "ayTutoringConfirmation";

const CANONICAL_STEP_NAMES: Record<string, string> = {
  welcome: "Welcome",
  student: "Student",
  contacts: "Parents & billing information",
  needs: "Tutoring needs",
  schedule: "Schedule",
  payment: "Plan",
  agreement: "Agreement",
  review: "Review",
};

type TutorOption = { id: string; displayName: string; openSlots: number };
type SlotOption = {
  id: string;
  label: string | null;
  dayOfWeek: number;
  startTimeLocal: string;
  endTimeLocal: string;
  openSeats: number;
};

type PaymentContinuation = {
  token: string;
  amountCents: number;
  serviceFeeCents: number;
  dueAt: string;
  label: string;
  requiresCard: boolean;
  invitePaths: Array<{ label: string; path: string }>;
};

type ConfirmationInvite = { label: string; path: string };

function RateSection({
  title,
  options,
  selectable,
  value,
  onChange,
  invalid,
}: {
  title: string;
  options: typeof ACADEMIC_RATE_PACKAGES.options;
  selectable?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
}) {
  if (selectable) {
    return (
      <Field label={title} required invalid={invalid}>
        <select value={value} onChange={(event) => onChange?.(event.target.value)}>
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
    );
  }
  return (
    <section className="public-ay-rate-section" aria-label={title}>
      <h2>{title}</h2>
      <ul>
        {options.map((option) => (
          <li key={option.id}>{option.label}</li>
        ))}
      </ul>
    </section>
  );
}

function AcademicYearPolicy() {
  return (
    <details className="public-ay-details">
      <summary>Read full Tutoring Policy</summary>
      <div className="public-ay-details-copy">
        <h2>Tutoring Policy</h2>
        {ACADEMIC_YEAR_POLICY_SECTIONS.map((section) => (
          <section key={section.heading}>
            <h3>{section.heading}</h3>
            <p className="public-ay-source-text">{section.body}</p>
          </section>
        ))}
      </div>
    </details>
  );
}

function PaymentTerms() {
  return (
    <details className="public-ay-details">
      <summary>Read full Payment Terms</summary>
      <div className="public-ay-details-copy">
        <p className="public-ay-source-text">{ACADEMIC_YEAR_PAYMENT_TERMS}</p>
      </div>
    </details>
  );
}

function ReviewInstallmentSummary({ paymentPlanId, packageCode }: { paymentPlanId: string; packageCode: string }) {
  const installments = buildAcademicYearReviewInstallments(paymentPlanId, packageCode);
  if (!installments) {
    return <p>Pricing and the payment schedule will be confirmed by Professional Tutoring before payment.</p>;
  }
  return (
    <div className="public-ay-review-payment">
      <p>
        <strong>Amount due at the secure payment step:</strong> {formatReviewCurrency(installments[0]!.amountCents)}
        {installments[0]!.serviceFeeCents > 0
          ? ` (includes ${formatReviewCurrency(installments[0]!.serviceFeeCents)} 3.6% card service fee)`
          : ""}
      </p>
      <p><strong>Future installments:</strong></p>
      {installments.length > 1 ? (
        <ul>
          {installments.slice(1).map((installment) => (
            <li key={`${installment.label}-${installment.dueAt.toISOString()}`}>
              {installment.label}: {formatReviewCurrency(installment.amountCents)} due {installment.dueAt.toLocaleDateString("en-US")}
            </li>
          ))}
        </ul>
      ) : (
        <p>No future installment remains after the Full Year payment.</p>
      )}
    </div>
  );
}

function AdvancedSubjectExplanation() {
  return (
    <div className="public-ay-help">
      <p>The following advanced subjects will be charged at the rates below.</p>
      <ul>
        <li>All AP/IB subjects</li>
        <li>Multivariable Calculus</li>
        <li>Linear Algebra</li>
        <li>Any community college or university class</li>
      </ul>
    </div>
  );
}

type PublicFieldSettings = Record<string, { label: string; placeholder: string; visible: boolean; order: number }>;

const FIELD_ID_BY_FALLBACK_LABEL: Record<string, string> = {
  School: "school",
  Grade: "grade",
  "Graduation year": "graduation_year",
  Gender: "gender",
  Birthdate: "birthdate",
  Phone: "student_cell",
  "Student cell": "student_cell",
  Email: "student_email",
  "Student email": "student_email",
  "How did you hear about us?": "referral_source",
  "Payment plan": "academic_payment_plan",
  "Hours / rates (standard)": "academic_rate_package",
  "Hours / rates (advanced)": "academic_advanced_rate_package",
  "Automatically charge a card for scheduled payments?": "auto_charge",
  "Alternative form of payment": "alt_payment_method",
  "Parent signature (type your full name)": "consent_agreement",
  "Student signature (type full name)": "consent_agreement",
};

const PublicFieldSettingsContext = createContext<PublicFieldSettings>({});

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
  invalid,
  fixedLabel = false,
  fixedOrder = false,
  children,
}: {
  label: string;
  required?: boolean;
  invalid?: boolean;
  fixedLabel?: boolean;
  fixedOrder?: boolean;
  children: React.ReactNode;
}) {
  const settings = useContext(PublicFieldSettingsContext);
  const setting = settings[FIELD_ID_BY_FALLBACK_LABEL[label] ?? ""];
  if (setting && !setting.visible) return null;
  const control =
    setting?.placeholder && isValidElement(children) && (children.type === "input" || children.type === "textarea")
      ? cloneElement(children as React.ReactElement<{ placeholder?: string }>, { placeholder: setting.placeholder })
      : children;
  return (
    <label
      className={invalid ? "public-ay-field is-invalid" : "public-ay-field"}
      style={setting && !fixedOrder ? { order: setting.order } : undefined}
    >
      <span>
          {fixedLabel ? label : setting?.label || label}
        {required ? <RequiredMark /> : null}
      </span>
      {control}
    </label>
  );
}

function AddressFields({
  street,
  city,
  state,
  postalCode,
  required,
  showErrors,
  onChange,
}: {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  required?: boolean;
  showErrors?: boolean;
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

  const streetInvalid = Boolean(required && showErrors && !street.trim());
  const cityInvalid = Boolean(required && showErrors && !city.trim());
  const stateInvalid = Boolean(required && showErrors && !state);
  const zipInvalid = Boolean(required && showErrors && !postalCode.trim());

  return (
    <div className="public-ay-address">
      <div className="public-ay-grid">
        <Field label="Street" required={required} invalid={streetInvalid}>
          <AddressAutocompleteInput
            value={street}
            invalid={streetInvalid}
            onChange={(value) => onChange({ street: value })}
            onSelect={applySuggestion}
          />
        </Field>
        <Field label="City" required={required} invalid={cityInvalid}>
          <input
            value={city}
            className={cityInvalid ? "is-invalid" : undefined}
            onChange={(event) => onChange({ city: event.target.value })}
            autoComplete="address-level2"
          />
        </Field>
      </div>
      <div className="public-ay-grid">
        <Field label="State" required={required} invalid={stateInvalid}>
          <select
            value={state}
            className={stateInvalid ? "is-invalid" : undefined}
            onChange={(event) => onChange({ state: event.target.value })}
            autoComplete="address-level1"
          >
            <option value="">Select</option>
            {US_STATES.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="ZIP" required={required} invalid={zipInvalid}>
          <input
            value={postalCode}
            className={zipInvalid ? "is-invalid" : undefined}
            onChange={(event) => onChange({ postalCode: event.target.value })}
            autoComplete="postal-code"
          />
        </Field>
      </div>
    </div>
  );
}

function studentAddressFrom(draft: Draft) {
  return {
    addressLine1: draft.studentAddressLine1,
    city: draft.studentCity,
    state: draft.studentState,
    postalCode: draft.studentPostalCode,
  };
}

function mailingFrom(
  sameAsStudent: boolean,
  own: { addressLine1: string; city: string; state: string; postalCode: string },
  student: { addressLine1: string; city: string; state: string; postalCode: string },
) {
  return sameAsStudent ? student : own;
}

function mailingIncomplete(address: { addressLine1: string; city: string; state: string; postalCode: string }) {
  return !address.addressLine1.trim() || !address.city.trim() || !address.state || !address.postalCode.trim();
}

function filledEmailInvalid(value: string) {
  const trimmed = value.trim();
  return Boolean(trimmed) && !isValidEmail(trimmed);
}

function filledPhoneInvalid(value: string) {
  const trimmed = value.trim();
  return Boolean(trimmed) && !isValidPhone(trimmed);
}

export function PublicAyTutoringRegistrationForm({
  title,
  formContent,
  formVersionToken,
}: {
  title: string;
  formContent?: PublicFormContent;
  formVersionToken?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useAppToast();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [tutors, setTutors] = useState<TutorOption[]>([]);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [paymentContinuation, setPaymentContinuation] = useState<PaymentContinuation | null>(null);
  const fieldSettings = useMemo<PublicFieldSettings>(
    () =>
      Object.fromEntries(
        (formContent?.steps ?? []).flatMap((formStep) =>
          formStep.fields.map((field) => [
            field.id,
            { label: field.label, placeholder: field.placeholder, visible: field.visible, order: field.order },
          ]),
        ),
      ),
    [formContent],
  );
  const formSteps = useMemo(
    () =>
      formContent?.steps?.length === STEPS.length
        ? [...formContent.steps].sort((left, right) => left.order - right.order)
        : STEPS.map((name, order) => ({ key: `legacy_${order}`, name, helpText: "", order, fields: [] })),
    [formContent],
  );
  const visibleSteps = useMemo(
    () => [
      ...formSteps.map((item) => ({ ...item, name: CANONICAL_STEP_NAMES[item.key] ?? item.name })),
      ...(paymentContinuation ? [{ key: "payment_stage", name: "Payment" }] : []),
    ],
    [formSteps, paymentContinuation],
  );
  const activeStepKey = paymentContinuation ? "payment_stage" : formSteps[step]?.key;
  const stepIndexFor = (key: string) => formSteps.findIndex((item) => item.key === key);
  const subjectRateProfile = useMemo(
    () => academicSubjectRateProfile(draft.subjectCodes),
    [draft.subjectCodes],
  );
  const matchingRequiresStaff = useMemo(
    () => requiresAcademicYearStaffReview(draft.subjectCodes),
    [draft.subjectCodes],
  );
  const primarySubject = !matchingRequiresStaff ? draft.primarySubjectCode : "";

  useEffect(() => {
    if (searchParams.get("payment") !== "return") return;
    const saved = window.sessionStorage.getItem(PENDING_PAYMENT_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as PaymentContinuation;
      if (parsed?.token && !paymentContinuation) setPaymentContinuation(parsed);
    } catch {
      window.sessionStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
    }
  }, [paymentContinuation, searchParams]);

  function patch(next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  function toggleList(key: "subjectCodes" | "testPrepInterests" | "preferredWindowIds", id: string) {
    setDraft((current) => {
      const list = current[key];
      const nextList = list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
      if (key !== "subjectCodes") {
        return { ...current, [key]: nextList };
      }
       const canMatchDirectly = nextList.length === 1 && nextList[0] !== "other";
       const primarySubjectCode = canMatchDirectly ? nextList[0]! : "";
      return {
        ...current,
        subjectCodes: nextList,
         primarySubjectCode,
         otherSubject: nextList.includes("other") ? current.otherSubject : "",
         tutorId: canMatchDirectly ? current.tutorId : "",
         slotId: canMatchDirectly ? current.slotId : "",
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
    if (activeStepKey === "student" || (!formContent && step === 1)) {
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
      if (!draft.studentEmail.trim()) return "Student email is required.";
      if (!isValidEmail(draft.studentEmail)) return "Enter a valid student email.";
      if (!draft.studentAddressLine1.trim() || !draft.studentCity.trim() || !draft.studentState || !draft.studentPostalCode.trim()) {
        return "Student address is required.";
      }
    }
    if (activeStepKey === "contacts" || (!formContent && step === 2)) {
      const studentMailing = studentAddressFrom(draft);
      const parent2Started = Boolean(
        draft.p2FirstName.trim() || draft.p2LastName.trim() || draft.p2Email.trim() || draft.p2Phone.trim(),
      );
      if (!draft.p1FirstName.trim() || !draft.p1LastName.trim() || !draft.p1Email.trim()) {
        return "Parent 1 name and email are required.";
      }
      if (!isValidEmail(draft.p1Email)) return "Enter a valid Parent 1 email.";
      if (!draft.p1Phone.trim()) return "Parent 1 phone is required.";
      if (!isValidPhone(draft.p1Phone)) return "Enter a valid Parent 1 phone number.";
      if (
        mailingIncomplete(
          mailingFrom(draft.p1SameAsStudentAddress, {
            addressLine1: draft.p1AddressLine1,
            city: draft.p1City,
            state: draft.p1State,
            postalCode: draft.p1PostalCode,
          }, studentMailing),
        )
      ) {
        return "Parent 1 mailing address is required.";
      }
      if (parent2Started) {
        if (!draft.p2FirstName.trim() || !draft.p2LastName.trim() || !draft.p2Email.trim()) {
          return "Parent 2 name and email are required when Parent 2 is provided.";
        }
        if (!isValidEmail(draft.p2Email)) return "Enter a valid Parent 2 email.";
        if (filledPhoneInvalid(draft.p2Phone)) return "Enter a valid Parent 2 phone number.";
        if (
          mailingIncomplete(
            mailingFrom(draft.p2SameAsStudentAddress, {
              addressLine1: draft.p2AddressLine1,
              city: draft.p2City,
              state: draft.p2State,
              postalCode: draft.p2PostalCode,
            }, studentMailing),
          )
        ) {
          return "Parent 2 mailing address is required.";
        }
      }
      if (!draft.billingFirstName.trim() || !draft.billingLastName.trim() || !draft.billingEmail.trim()) {
        return "Billing name, email, and address are required.";
      }
      if (!isValidEmail(draft.billingEmail)) return "Enter a valid billing email.";
      if (filledPhoneInvalid(draft.billingPhone)) return "Enter a valid billing phone number.";
      if (
        !draft.copyStudentAddressToBilling &&
        mailingIncomplete({
          addressLine1: draft.billingAddressLine1,
          city: draft.billingCity,
          state: draft.billingState,
          postalCode: draft.billingPostalCode,
        })
      ) {
        return "Billing name, email, and address are required.";
      }
    }
    if (activeStepKey === "needs" || (!formContent && step === 3)) {
      if (draft.subjectCodes.length === 0) return "Select at least one subject.";
      if (draft.subjectCodes.includes("other") && !draft.otherSubject.trim()) return "Tell us the other subject you need help with.";
      if (!draft.referralSource) return "Please tell us how you heard about us.";
    }
    if (activeStepKey === "schedule" || (!formContent && step === 4)) {
      if (!draft.schedulingPath) return "Choose how you’d like us to schedule.";
      if (matchingRequiresStaff && draft.schedulingPath !== "pt_chooses") {
        return "For multiple or unlisted subjects, Professional Tutoring will choose the tutor after reviewing your request.";
      }
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
    if (activeStepKey === "payment" || (!formContent && step === 5)) {
      if (!draft.paymentPlanId) return "Select a payment plan.";
      if (subjectRateProfile !== "mixed" && subjectRateProfile !== "staff_review") {
        const expected = subjectRateProfile === "advanced" ? draft.advancedHoursRatePackage : draft.hoursRatePackage;
        if (!expected) {
          return subjectRateProfile === "advanced"
            ? "Choose an Advanced Subjects Hours / Rates option."
            : "Choose a Standard Hours / Rates option.";
        }
      }
      if (!draft.policyAck) return "Please confirm that you read and understood the tutoring policy information.";
    }
    if (activeStepKey === "agreement" || (!formContent && step === 6)) {
      if (!draft.agreementAck) return "Please agree to the terms outlined in this Agreement.";
      if (!draft.parentSignature.trim() || !draft.studentSignature.trim()) {
        return "Parent and student signatures are required.";
      }
    }
    return null;
  }

  function next() {
    const problem = validateStep();
    if (problem) {
      setShowErrors(true);
      toast.error(problem);
      return;
    }
    setShowErrors(false);
    setStep((value) => Math.min(value + 1, formSteps.length - 1));
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
      setShowErrors(true);
      toast.error(problem);
      return;
    }
    setSaving(true);
    const studentMailing = studentAddressFrom(draft);
    const parent1Mailing = mailingFrom(
      draft.p1SameAsStudentAddress,
      {
        addressLine1: draft.p1AddressLine1,
        city: draft.p1City,
        state: draft.p1State,
        postalCode: draft.p1PostalCode,
      },
      studentMailing,
    );
    const parent2Mailing = mailingFrom(
      draft.p2SameAsStudentAddress,
      {
        addressLine1: draft.p2AddressLine1,
        city: draft.p2City,
        state: draft.p2State,
        postalCode: draft.p2PostalCode,
      },
      studentMailing,
    );
    const billingAddress = draft.copyStudentAddressToBilling
      ? studentMailing
      : {
          addressLine1: draft.billingAddressLine1,
          city: draft.billingCity,
          state: draft.billingState,
          postalCode: draft.billingPostalCode,
        };
    try {
      const response = await fetch("/api/public/ay-tutoring-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formVersionToken,
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
            otherInformation: draft.otherInformation,
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
            sameAsStudentAddress: draft.p1SameAsStudentAddress,
            ...parent1Mailing,
          },
          parent2:
            draft.p2FirstName || draft.p2LastName || draft.p2Email
              ? {
                  firstName: draft.p2FirstName,
                  lastName: draft.p2LastName,
                  email: draft.p2Email,
                  phone: draft.p2Phone,
                  sameAsStudentAddress: draft.p2SameAsStudentAddress,
                  ...parent2Mailing,
                }
              : null,
          householdAddress: parent1Mailing,
          billing: {
            firstName: draft.billingFirstName,
            lastName: draft.billingLastName,
            email: draft.billingEmail,
            phone: draft.billingPhone,
            sameAsStudentAddress: draft.copyStudentAddressToBilling,
            ...billingAddress,
          },
          subjectCodes: draft.subjectCodes,
          primarySubjectCode: draft.primarySubjectCode,
          otherSubject: draft.otherSubject,
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
          policyAck: draft.policyAck,
          agreementAck: draft.agreementAck,
          parentSignature: draft.parentSignature,
          studentSignature: draft.studentSignature,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        if (response.status === 409 && data.code === "slot_unavailable") {
          setStep(Math.max(0, stepIndexFor("schedule")));
        }
        toast.error(data.error || "Unable to submit.");
        return;
      }
      const invitePaths = (data.invitePaths ?? []) as ConfirmationInvite[];
      if (data.paymentDeferred) {
        window.sessionStorage.setItem(
          CONFIRMATION_STORAGE_KEY,
          JSON.stringify({
            paymentStatus: "pending_staff_review",
            invitePaths,
            message: "Your request has been received. Professional Tutoring will review the subjects and confirm pricing before payment.",
          }),
        );
        router.push("/register/academic-year-tutoring/confirmation");
        return;
      }
      if (!data.payment?.token) {
        toast.error("Registration was saved, but payment could not be prepared. Please contact Professional Tutoring.");
        return;
      }
      const continuation = { ...(data.payment as Omit<PaymentContinuation, "invitePaths">), invitePaths };
      window.sessionStorage.setItem(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(continuation));
      setPaymentContinuation(continuation);
    } catch {
      toast.error("Unable to submit. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PublicFieldSettingsContext.Provider value={fieldSettings}>
    <div className="public-ay-card">
      <AppToastHost toasts={toast.toasts} onDismiss={toast.dismiss} />
      <input type="hidden" name="formVersionToken" value={formVersionToken ?? ""} readOnly />
      <p className="public-ay-kicker">{formContent?.title || title}</p>
       <h1>{activeStepKey === "payment_stage" ? "Payment" : visibleSteps[step]?.name ?? STEPS[step]}</h1>
      {formContent?.description ? <p className="public-ay-description">{formContent.description}</p> : null}
      <ol className="public-ay-steps" aria-label="Registration steps">
         {visibleSteps.map((item, index) => (
           <li
             key={item.key}
             className={
               item.key === "payment_stage"
                 ? "is-current"
                 : index === step
                   ? "is-current"
                   : index < step
                     ? "is-done"
                     : undefined
             }
           >
            {item.name}
          </li>
        ))}
      </ol>

      {(activeStepKey === "welcome" || (!formContent && step === 0)) ? (
        <div className="public-ay-copy">
          <p>{formContent?.introduction || "Register for Academic Year Tutoring. We’ll save your information and invite you to the family portal."}</p>
          <p>{formContent?.helpText || "Your payment setup or required payment is completed before your registration is confirmed."}</p>
        </div>
      ) : null}

      {(activeStepKey === "student" || (!formContent && step === 1)) ? (
        <div className="public-ay-stack">
          <div className="public-ay-student-grid">
            <Field label="First name" required fixedOrder invalid={showErrors && !draft.studentFirstName.trim()}>
              <input value={draft.studentFirstName} onChange={(event) => patch({ studentFirstName: event.target.value })} />
            </Field>
            <Field label="Last name" required fixedOrder invalid={showErrors && !draft.studentLastName.trim()}>
              <input value={draft.studentLastName} onChange={(event) => patch({ studentLastName: event.target.value })} />
            </Field>
            <Field label="Gender" required fixedOrder invalid={showErrors && !draft.gender}>
              <select value={draft.gender} onChange={(event) => patch({ gender: event.target.value })}>
                <option value="">Select</option>
                {GENDER.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="School" required fixedOrder invalid={showErrors && !draft.schoolName.trim()}>
              <input value={draft.schoolName} onChange={(event) => patch({ schoolName: event.target.value })} />
            </Field>
            <Field label="Grade" required fixedOrder invalid={showErrors && !draft.gradeLabel}>
              <select value={draft.gradeLabel} onChange={(event) => patch({ gradeLabel: event.target.value })}>
                <option value="">Select</option>
                {GRADE_LABELS.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Graduation year" required fixedOrder invalid={showErrors && !draft.graduationYear}>
              <select value={draft.graduationYear} onChange={(event) => patch({ graduationYear: event.target.value })}>
                <option value="">Select</option>
                {GRADUATION_YEARS.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Birthdate" required fixedOrder invalid={showErrors && !draft.birthdate}>
              <input type="date" value={draft.birthdate} onChange={(event) => patch({ birthdate: event.target.value })} />
            </Field>
            <Field
              label="Phone"
              required
              fixedLabel
              fixedOrder
              invalid={showErrors && (!draft.studentCell.trim() || filledPhoneInvalid(draft.studentCell))}
            >
              <PhoneInput
                value={draft.studentCell}
                required
                invalid={showErrors && (!draft.studentCell.trim() || filledPhoneInvalid(draft.studentCell))}
                onChange={(studentCell) => patch({ studentCell })}
                autoComplete="tel"
              />
            </Field>
            <Field
              label="Email"
              required
              fixedLabel
              fixedOrder
              invalid={showErrors && (!draft.studentEmail.trim() || filledEmailInvalid(draft.studentEmail))}
            >
              <input
                type="email"
                required
                value={draft.studentEmail}
                onChange={(event) => patch({ studentEmail: event.target.value })}
                autoComplete="email"
              />
            </Field>
          </div>
          <h2>Address</h2>
          <AddressFields
            street={draft.studentAddressLine1}
            city={draft.studentCity}
            state={draft.studentState}
            postalCode={draft.studentPostalCode}
            required
            showErrors={showErrors}
            onChange={(next) =>
              patch({
                ...(next.street !== undefined ? { studentAddressLine1: next.street } : {}),
                ...(next.city !== undefined ? { studentCity: next.city } : {}),
                ...(next.state !== undefined ? { studentState: next.state } : {}),
                ...(next.postalCode !== undefined ? { studentPostalCode: next.postalCode } : {}),
              })
            }
          />
          <div className="public-ay-grid public-ay-notes-grid">
            <label className="public-ay-field">
              <span>504 / IEP / testing accommodations (optional)</span>
              <textarea
                value={draft.supportNotes}
                onChange={(event) => patch({ supportNotes: event.target.value })}
                rows={4}
              />
            </label>
            <label className="public-ay-field">
              <span>Other information</span>
              <textarea
                value={draft.otherInformation}
                onChange={(event) => patch({ otherInformation: event.target.value })}
                rows={4}
              />
            </label>
          </div>
        </div>
      ) : null}

      {(activeStepKey === "contacts" || (!formContent && step === 2)) ? (
        <div className="public-ay-stack">
          <h2>Parent 1</h2>
          <div className="public-ay-grid">
            <Field label="First name" required invalid={showErrors && !draft.p1FirstName.trim()}>
              <input value={draft.p1FirstName} onChange={(event) => patch({ p1FirstName: event.target.value })} />
            </Field>
            <Field label="Last name" required invalid={showErrors && !draft.p1LastName.trim()}>
              <input value={draft.p1LastName} onChange={(event) => patch({ p1LastName: event.target.value })} />
            </Field>
            <Field label="Email" required invalid={showErrors && (!draft.p1Email.trim() || filledEmailInvalid(draft.p1Email))}>
              <input type="email" value={draft.p1Email} onChange={(event) => patch({ p1Email: event.target.value })} autoComplete="email" />
            </Field>
            <Field
              label="Phone"
              required
              invalid={showErrors && (!draft.p1Phone.trim() || filledPhoneInvalid(draft.p1Phone))}
            >
              <PhoneInput
                value={draft.p1Phone}
                invalid={showErrors && (!draft.p1Phone.trim() || filledPhoneInvalid(draft.p1Phone))}
                onChange={(p1Phone) => patch({ p1Phone })}
              />
            </Field>
          </div>
          <h2>Parent 1 mailing address</h2>
          <label className="public-ay-check">
            <input
              type="checkbox"
              checked={draft.p1SameAsStudentAddress}
              onChange={(event) => {
                const checked = event.target.checked;
                patch({
                  p1SameAsStudentAddress: checked,
                  ...(checked
                    ? {
                        p1AddressLine1: draft.studentAddressLine1,
                        p1City: draft.studentCity,
                        p1State: draft.studentState,
                        p1PostalCode: draft.studentPostalCode,
                      }
                    : {}),
                });
              }}
            />
            Same as student address
          </label>
          {!draft.p1SameAsStudentAddress ? (
            <AddressFields
              street={draft.p1AddressLine1}
              city={draft.p1City}
              state={draft.p1State}
              postalCode={draft.p1PostalCode}
              required
              showErrors={showErrors}
              onChange={(next) =>
                patch({
                  ...(next.street !== undefined ? { p1AddressLine1: next.street } : {}),
                  ...(next.city !== undefined ? { p1City: next.city } : {}),
                  ...(next.state !== undefined ? { p1State: next.state } : {}),
                  ...(next.postalCode !== undefined ? { p1PostalCode: next.postalCode } : {}),
                })
              }
            />
          ) : null}
          <h2>Parent 2 (optional)</h2>
          <div className="public-ay-grid">
            <Field label="First name">
              <input value={draft.p2FirstName} onChange={(event) => patch({ p2FirstName: event.target.value })} />
            </Field>
            <Field label="Last name">
              <input value={draft.p2LastName} onChange={(event) => patch({ p2LastName: event.target.value })} />
            </Field>
            <Field label="Email" invalid={showErrors && filledEmailInvalid(draft.p2Email)}>
              <input type="email" value={draft.p2Email} onChange={(event) => patch({ p2Email: event.target.value })} autoComplete="email" />
            </Field>
            <Field label="Phone" invalid={showErrors && filledPhoneInvalid(draft.p2Phone)}>
              <PhoneInput
                value={draft.p2Phone}
                invalid={showErrors && filledPhoneInvalid(draft.p2Phone)}
                onChange={(p2Phone) => patch({ p2Phone })}
              />
            </Field>
          </div>
          <h2>Parent 2 mailing address</h2>
          <label className="public-ay-check">
            <input
              type="checkbox"
              checked={draft.p2SameAsStudentAddress}
              onChange={(event) => {
                const checked = event.target.checked;
                patch({
                  p2SameAsStudentAddress: checked,
                  ...(checked
                    ? {
                        p2AddressLine1: draft.studentAddressLine1,
                        p2City: draft.studentCity,
                        p2State: draft.studentState,
                        p2PostalCode: draft.studentPostalCode,
                      }
                    : {}),
                });
              }}
            />
            Same as student address
          </label>
          {!draft.p2SameAsStudentAddress ? (
            <AddressFields
              street={draft.p2AddressLine1}
              city={draft.p2City}
              state={draft.p2State}
              postalCode={draft.p2PostalCode}
              required={Boolean(
                draft.p2FirstName.trim() || draft.p2LastName.trim() || draft.p2Email.trim() || draft.p2Phone.trim(),
              )}
              showErrors={showErrors}
              onChange={(next) =>
                patch({
                  ...(next.street !== undefined ? { p2AddressLine1: next.street } : {}),
                  ...(next.city !== undefined ? { p2City: next.city } : {}),
                  ...(next.state !== undefined ? { p2State: next.state } : {}),
                  ...(next.postalCode !== undefined ? { p2PostalCode: next.postalCode } : {}),
                })
              }
            />
          ) : null}
          <h2>Billing information</h2>
          <p className="public-ay-help">Who should we bill? This can be different from Parent 1 or Parent 2.</p>
          <div className="public-ay-grid">
            <Field label="Billing first name" required invalid={showErrors && !draft.billingFirstName.trim()}>
              <input value={draft.billingFirstName} onChange={(event) => patch({ billingFirstName: event.target.value })} />
            </Field>
            <Field label="Billing last name" required invalid={showErrors && !draft.billingLastName.trim()}>
              <input value={draft.billingLastName} onChange={(event) => patch({ billingLastName: event.target.value })} />
            </Field>
            <Field
              label="Billing email"
              required
              invalid={showErrors && (!draft.billingEmail.trim() || filledEmailInvalid(draft.billingEmail))}
            >
              <input
                type="email"
                value={draft.billingEmail}
                onChange={(event) => patch({ billingEmail: event.target.value })}
                autoComplete="email"
              />
            </Field>
            <Field label="Billing phone" invalid={showErrors && filledPhoneInvalid(draft.billingPhone)}>
              <PhoneInput
                value={draft.billingPhone}
                invalid={showErrors && filledPhoneInvalid(draft.billingPhone)}
                onChange={(billingPhone) => patch({ billingPhone })}
              />
            </Field>
          </div>
          <label className="public-ay-check">
            <input
              type="checkbox"
              checked={draft.copyStudentAddressToBilling}
              onChange={(event) => {
                const checked = event.target.checked;
                patch({
                  copyStudentAddressToBilling: checked,
                  ...(checked
                    ? {
                        billingAddressLine1: draft.studentAddressLine1,
                        billingCity: draft.studentCity,
                        billingState: draft.studentState,
                        billingPostalCode: draft.studentPostalCode,
                      }
                    : {}),
                });
              }}
            />
            Same as student address
          </label>
          {!draft.copyStudentAddressToBilling ? (
            <AddressFields
              street={draft.billingAddressLine1}
              city={draft.billingCity}
              state={draft.billingState}
              postalCode={draft.billingPostalCode}
              required
              showErrors={showErrors}
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

      {(activeStepKey === "needs" || (!formContent && step === 3)) ? (
        <div className="public-ay-stack">
          <p>Select every subject that applies. Professional Tutoring will match the right tutor for your request.</p>
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
          {draft.subjectCodes.includes("other") ? (
            <Field label="Other subject" required invalid={showErrors && !draft.otherSubject.trim()}>
              <input value={draft.otherSubject} onChange={(event) => patch({ otherSubject: event.target.value })} />
            </Field>
          ) : null}
          {matchingRequiresStaff ? (
            <p className="public-ay-help">Professional Tutoring will review the requested subjects and choose the best tutor match.</p>
          ) : null}
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
          <Field label="How did you hear about us?" required invalid={showErrors && !draft.referralSource}>
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

      {(activeStepKey === "schedule" || (!formContent && step === 4)) ? (
        <div className="public-ay-stack">
          <div className="public-ay-choices">
            <button
              type="button"
              className={draft.schedulingPath === "family_selected" ? "is-selected" : undefined}
              disabled={matchingRequiresStaff}
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
          {matchingRequiresStaff ? (
            <p className="public-ay-help">For multiple or unlisted subjects, Professional Tutoring will choose the tutor after reviewing your request.</p>
          ) : null}
          {draft.schedulingPath === "family_selected" ? (
            <>
              <p className="public-ay-help">
                We’ll save your preferred time. Your place is confirmed after payment in a later step. This does not
                hold a seat.
              </p>
              <Field label="Preferred day and time" required invalid={showErrors && !draft.windowId}>
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
                      {DAY_NAMES[slot.dayOfWeek]} {formatTimeRange12h(slot.startTimeLocal, slot.endTimeLocal)}
                      <small>
                        {slot.openSeats < 1
                          ? "Full"
                          : `${slot.openSeats} ${slot.openSeats === 1 ? "spot" : "spots"} available`}
                      </small>
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

      {(activeStepKey === "payment" || (!formContent && step === 5)) ? (
        <div className="public-ay-stack">
          <p>Choose your payment plan. The secure card step follows your review.</p>
          <Field label="Payment plan" required invalid={showErrors && !draft.paymentPlanId}>
            <select value={draft.paymentPlanId} onChange={(event) => patch({ paymentPlanId: event.target.value })}>
              <option value="">Select</option>
              {ACADEMIC_PAYMENT_PLANS.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          {subjectRateProfile === "standard" ? (
            <RateSection
              title="Standard Hours / Rates"
              options={ACADEMIC_RATE_PACKAGES.options}
              selectable
              value={draft.hoursRatePackage}
              invalid={showErrors && !draft.hoursRatePackage}
              onChange={(hoursRatePackage) => patch({ hoursRatePackage, advancedHoursRatePackage: "" })}
            />
          ) : null}
          {subjectRateProfile === "advanced" ? (
            <>
              <AdvancedSubjectExplanation />
              <RateSection
                title="Advanced Subjects Hours / Rates"
                options={ACADEMIC_ADVANCED_RATE_PACKAGES.options}
                selectable
                value={draft.advancedHoursRatePackage}
                invalid={showErrors && !draft.advancedHoursRatePackage}
                onChange={(advancedHoursRatePackage) => patch({ advancedHoursRatePackage, hoursRatePackage: "" })}
              />
            </>
          ) : null}
          {subjectRateProfile === "mixed" ? (
            <>
              <AdvancedSubjectExplanation />
              <RateSection title="Standard Hours / Rates" options={ACADEMIC_RATE_PACKAGES.options} />
              <RateSection title="Advanced Subjects Hours / Rates" options={ACADEMIC_ADVANCED_RATE_PACKAGES.options} />
              <p className="public-ay-help">Your requested subjects include both Standard and Advanced course levels. Professional Tutoring will review the request and confirm pricing before payment.</p>
            </>
          ) : null}
          {subjectRateProfile === "staff_review" ? (
            <p className="public-ay-help">Professional Tutoring will review the requested subject details and confirm the tutor match and pricing before payment.</p>
          ) : null}
          <p className="public-ay-help">Tutoring sessions are two hours each. The hourly rate is only available when there is no full-time tutoring spot open or on a short-term one- to two-week trial basis. Once a full-time spot becomes available or the trial period ends, students who continue with tutoring will be considered full-time and will be accorded the lower full-time rates listed above.</p>
          <p className="public-ay-help">To be confirmed by PT staff.</p>
          <AcademicYearPolicy />
          <label className="public-ay-check">
            <input
              type="checkbox"
              checked={draft.policyAck}
              onChange={(event) => patch({ policyAck: event.target.checked })}
            />
            <span>
              Yes, I read &amp; understood the tutoring policy information.
              <RequiredMark />
            </span>
          </label>
          <p className="public-ay-help">A card is collected securely after review and kept on file for scheduled Academic Year payments. A 3.6% credit/debit card service fee applies.</p>
          <PaymentTerms />
        </div>
      ) : null}

      {(activeStepKey === "agreement" || (!formContent && step === 6)) ? (
        <div className="public-ay-stack">
          <details className="public-ay-details" open>
            <summary>Acknowledgements and Release</summary>
            <div className="public-ay-details-copy">
              <p className="public-ay-source-text">{ACADEMIC_YEAR_ACKNOWLEDGEMENTS_RELEASE}</p>
            </div>
          </details>
          <label className="public-ay-check">
            <input
              type="checkbox"
              checked={draft.agreementAck}
              onChange={(event) => patch({ agreementAck: event.target.checked })}
            />
            <span>
              I agree to the terms outlined in this Agreement.
              <RequiredMark />
            </span>
          </label>
          <Field label="Signature Parent" required invalid={showErrors && !draft.parentSignature.trim()}>
            <input value={draft.parentSignature} onChange={(event) => patch({ parentSignature: event.target.value })} />
          </Field>
          <Field label="Signature Student" required invalid={showErrors && !draft.studentSignature.trim()}>
            <input value={draft.studentSignature} onChange={(event) => patch({ studentSignature: event.target.value })} />
          </Field>
          <p className="public-ay-help"><strong>Date:</strong> recorded when you submit this Agreement.</p>
        </div>
      ) : null}

      {(activeStepKey === "review" || (!formContent && step === 7)) ? (
        <div className="public-ay-stack">
          <section>
            <h2>Student</h2>
            <p>
              {draft.studentFirstName} {draft.studentLastName}
              {draft.schoolName ? ` · ${draft.schoolName}` : ""}
              {draft.gradeLabel
                ? ` · ${GRADE_LABELS.options.find((option) => option.id === draft.gradeLabel)?.label ?? draft.gradeLabel}`
                : ""}
            </p>
            <p>
              {[draft.studentAddressLine1, draft.studentCity, draft.studentState, draft.studentPostalCode]
                .filter(Boolean)
                .join(", ")}
            </p>
            {draft.otherInformation.trim() ? <p>Other information: {draft.otherInformation}</p> : null}
          </section>
          <section>
            <h2>Parents / Billing</h2>
            <p>
              Parent 1: {draft.p1FirstName} {draft.p1LastName} ({draft.p1Email})
              {` · ${
                mailingFrom(
                  draft.p1SameAsStudentAddress,
                  {
                    addressLine1: draft.p1AddressLine1,
                    city: draft.p1City,
                    state: draft.p1State,
                    postalCode: draft.p1PostalCode,
                  },
                  studentAddressFrom(draft),
                ).addressLine1
              }`}
            </p>
            {draft.p2FirstName || draft.p2LastName || draft.p2Email ? (
              <p>
                Parent 2: {draft.p2FirstName} {draft.p2LastName}
                {draft.p2Email ? ` (${draft.p2Email})` : ""}
              </p>
            ) : (
              <p>Parent 2: not provided</p>
            )}
            <p>
              Bill to: {draft.billingFirstName} {draft.billingLastName} ({draft.billingEmail})
            </p>
          </section>
          <section>
            <h2>Tutoring needs</h2>
            <p>
              Requested: {draft.subjectCodes.map((code) => (code === "other" && draft.otherSubject ? `Other: ${draft.otherSubject}` : academicSubjectLabel(code))).join(", ")}
            </p>
            {draft.testPrepInterests.length ? (
              <p>
                Test Prep: {draft.testPrepInterests
                  .map((id) => TEST_PREP_INTERESTS.options.find((option) => option.id === id)?.label ?? id)
                  .join(", ")}
              </p>
            ) : null}
            {matchingRequiresStaff ? <p>Professional Tutoring will review the tutor match.</p> : null}
          </section>
          <section>
            <h2>Schedule</h2>
            <p>
              {draft.schedulingPath === "family_selected"
                ? `Preferred tutor: ${selectedTutorName ?? "Selected tutor"}${
                    selectedSlot
                      ? ` · ${DAY_NAMES[selectedSlot.dayOfWeek]} ${formatTimeRange12h(selectedSlot.startTimeLocal, selectedSlot.endTimeLocal)}`
                      : ""
                  }. We will recheck availability while completing payment.`
                : "Professional Tutoring will choose a tutor and time."}
            </p>
          </section>
          <section>
            <h2>Plan</h2>
            <p>
              {ACADEMIC_PAYMENT_PLANS.options.find((option) => option.id === draft.paymentPlanId)?.label ??
                draft.paymentPlanId}
            </p>
            {draft.hoursRatePackage ? (
              <p>
                {ACADEMIC_RATE_PACKAGES.options.find((option) => option.id === draft.hoursRatePackage)?.label}
              </p>
            ) : null}
            {draft.advancedHoursRatePackage ? (
              <p>
                {
                  ACADEMIC_ADVANCED_RATE_PACKAGES.options.find(
                    (option) => option.id === draft.advancedHoursRatePackage,
                  )?.label
                }
              </p>
            ) : null}
            {subjectRateProfile === "standard" ? <p>Applicable rate section: Standard Hours/Rates</p> : null}
            {subjectRateProfile === "advanced" ? <p>Applicable rate section: Advanced Subjects Hours/Rates</p> : null}
            {subjectRateProfile === "mixed" ? <p>Applicable rate sections: Standard and Advanced Hours/Rates</p> : null}
            {subjectRateProfile === "mixed" || subjectRateProfile === "staff_review" ? (
              <p>Pricing will be confirmed by Professional Tutoring before payment.</p>
            ) : (
              <ReviewInstallmentSummary
                paymentPlanId={draft.paymentPlanId}
                packageCode={draft.hoursRatePackage || draft.advancedHoursRatePackage}
              />
            )}
          </section>
          <section>
            <h2>Agreement</h2>
            <p>Policy acknowledgement: Yes, I read &amp; understood the tutoring policy information.</p>
            <p>Consent: I agree to the terms outlined in this Agreement.</p>
            <p>Signature Parent: {draft.parentSignature}</p>
            <p>Signature Student: {draft.studentSignature}</p>
            <p>Date: recorded when you submit this Agreement.</p>
          </section>
        </div>
      ) : null}

      {paymentContinuation ? (
        <PublicAyTutoringPaymentPanel
          token={paymentContinuation.token}
          amountCents={paymentContinuation.amountCents}
          serviceFeeCents={paymentContinuation.serviceFeeCents}
          dueAt={paymentContinuation.dueAt}
          label={paymentContinuation.label}
          requiresCard={paymentContinuation.requiresCard}
          returnedIntentId={searchParams.get("payment_intent") ?? searchParams.get("setup_intent")}
          onCompleted={(payment) => {
            sessionStorage.setItem(
              CONFIRMATION_STORAGE_KEY,
              JSON.stringify({
                message:
                  payment.schedulingPath === "family_selected"
                    ? payment.pendingManualPayment
                      ? "Your registration and selected time are recorded. Complete your selected payment method to finalize billing."
                      : "Your registration and selected time are confirmed."
                    : "Your registration is ready for Professional Tutoring to assign a tutor and available time.",
                schedulingPath: payment.schedulingPath,
                bookingId: payment.bookingId,
                paymentStatus: payment.paymentStatus,
                portalInvitation: payment.portalInvitation,
                invitePaths: paymentContinuation.invitePaths,
              }),
            );
            sessionStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
            toast.success("Registration confirmed.");
            router.push("/register/academic-year-tutoring/confirmation");
          }}
        />
      ) : null}

      {!paymentContinuation ? <div className="public-ay-actions">
        {step > 0 ? (
          <button type="button" className="public-ay-secondary" onClick={() => {
            setShowErrors(false);
            setStep((value) => value - 1);
          }}>
            Back
          </button>
        ) : (
          <span />
        )}
        {step < formSteps.length - 1 ? (
          <button type="button" className="public-ay-primary" onClick={next}>
            {step === 0 ? "Start registration" : "Continue"}
          </button>
        ) : (
          <button type="button" className="public-ay-primary" onClick={() => void submit()} disabled={saving}>
            {saving ? "Submitting…" : "Submit registration"}
          </button>
        )}
      </div> : null}
    </div>
    </PublicFieldSettingsContext.Provider>
  );
}
