/**
 * Public Academic Year Tutoring intake.
 * Never call ensureFamilyGuardian here — mint invite tokens first so Clerk
 * linking happens on /invite/[token] before the family portal bootstrap.
 */
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { createTutoringRequest } from "@/lib/booking/create-tutoring-request";
import { findOpenPreferredSlot, resolveCatalogSubjectRow } from "@/lib/booking/open-slots-for-subject-window";
import { requireDb } from "@/lib/db";
import { guardians, households, students, tutors } from "@/lib/db/schema";
import {
  ACADEMIC_SUBJECTS,
  isValidOptionId,
} from "@/lib/forms/options";
import { loadActiveCancellationPolicy } from "@/lib/policy/cancellation";
import { createAyPublicPaymentContinuation } from "@/lib/public-intake/ay-tutoring-payment";
import { findHouseholdMatchCandidates } from "@/lib/staff/family-match";
import { buildHouseholdDisplayName, HOUSEHOLD_COUNTRY_US, MAX_GUARDIANS_PER_HOUSEHOLD } from "@/lib/staff/household-display-name";
import { assertNotStaffAsGuardian } from "@/lib/staff/staff-guardian-guard";
import { isValidEmail, isValidPhone } from "@/lib/validation/contact";

export class PublicIntakeError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "invalid_request") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type ContactInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  sameAsStudentAddress?: boolean;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

type AddressInput = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
};

export type AyTutoringRegistrationInput = {
  student: {
    firstName: string;
    lastName: string;
    schoolName: string;
    gradeLabel: string;
    graduationYear: string;
    gender: string;
    birthdate: string;
    cellPhone?: string;
    email?: string;
    supportNotes?: string;
    otherInformation?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  parent1: ContactInput;
  parent2?: ContactInput | null;
  /** Parent 1 mailing fallback for older clients; household billing still uses `billing`. */
  householdAddress?: AddressInput;
  billing: ContactInput & AddressInput;
  subjectCodes: string[];
  /** Explicit primary subject for tutor matching; must be one of subjectCodes. */
  primarySubjectCode: string;
  subjectNotes?: string;
  testPrepInterests?: string[];
  referralSource: string;
  schedulingPath: "family_selected" | "pt_chooses";
  preferredWindowIds?: string[];
  scheduleNotes?: string;
  tutorId?: string;
  slotId?: string;
  windowId?: string;
  paymentPlanId: string;
  hoursRatePackage?: string;
  advancedHoursRatePackage?: string;
  autoCharge?: string;
  altPaymentMethod?: string;
  policyAck: boolean;
  agreementAck: boolean;
  parentSignature: string;
  studentSignature: string;
};

function trim(value: unknown) {
  return String(value ?? "").trim();
}

function optional(value: unknown) {
  const text = trim(value);
  return text || null;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function inviteToken() {
  return randomBytes(24).toString("hex");
}

function requireContact(label: string, contact: ContactInput, requirePhone = false) {
  const firstName = trim(contact.firstName);
  const lastName = trim(contact.lastName);
  const email = normalizeEmail(contact.email);
  const phone = trim(contact.phone ?? "");
  if (!firstName || !lastName || !email) {
    throw new PublicIntakeError(`${label} first name, last name, and email are required.`);
  }
  if (!isValidEmail(email)) {
    throw new PublicIntakeError(`${label} email is not valid.`);
  }
  if (phone && !isValidPhone(phone)) {
    throw new PublicIntakeError(`${label} phone is not valid.`);
  }
  if (requirePhone && !phone) {
    throw new PublicIntakeError(`${label} phone is required.`);
  }
  return { firstName, lastName, email, phone: phone || undefined };
}

function requireAddress(label: string, address: Partial<AddressInput> | undefined) {
  const addressLine1 = trim(address?.addressLine1);
  const city = trim(address?.city);
  const state = trim(address?.state);
  const postalCode = trim(address?.postalCode);
  if (!addressLine1 || !city || !state || !postalCode) {
    throw new PublicIntakeError(`${label} street, city, state, and ZIP are required.`);
  }
  if (!isValidOptionId("US_STATES", state)) {
    throw new PublicIntakeError(`${label} state is not valid.`);
  }
  return {
    addressLine1,
    addressLine2: optional(address?.addressLine2) || undefined,
    city,
    state,
    postalCode,
  };
}

function resolveMailingAddress(
  label: string,
  contact: ContactInput | null | undefined,
  studentAddress: AddressInput,
  fallback?: Partial<AddressInput>,
) {
  if (contact?.sameAsStudentAddress) return studentAddress;
  const hasOwnStreet = Boolean(trim(contact?.addressLine1));
  return requireAddress(label, hasOwnStreet ? contact ?? undefined : fallback ?? contact ?? undefined);
}

function guardianAddressValues(address: AddressInput) {
  return {
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: HOUSEHOLD_COUNTRY_US,
  };
}

export async function submitAyTutoringRegistration(raw: AyTutoringRegistrationInput) {
  const studentFirst = trim(raw.student?.firstName);
  const studentLast = trim(raw.student?.lastName);
  const schoolName = trim(raw.student?.schoolName);
  const gradeLabel = trim(raw.student?.gradeLabel);
  const graduationYear = trim(raw.student?.graduationYear);
  const gender = trim(raw.student?.gender);
  const birthdate = trim(raw.student?.birthdate);
  const supportNotes = optional(raw.student?.supportNotes);
  const otherInformation = optional(raw.student?.otherInformation);
  const studentCell = optional(raw.student?.cellPhone);
  const studentEmail = optional(raw.student?.email);

  if (!studentFirst || !studentLast || !schoolName || !gradeLabel || !graduationYear || !gender || !birthdate) {
    throw new PublicIntakeError("Student name, school, grade, graduation year, gender, and birthdate are required.");
  }
  if (!isValidOptionId("GRADE_LABELS", gradeLabel)) throw new PublicIntakeError("Invalid grade.");
  if (!isValidOptionId("GRADUATION_YEARS", graduationYear)) throw new PublicIntakeError("Invalid graduation year.");
  if (!isValidOptionId("GENDER", gender)) throw new PublicIntakeError("Invalid gender.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
    throw new PublicIntakeError("Birthdate must be YYYY-MM-DD.");
  }
  if (studentEmail && !isValidEmail(studentEmail)) throw new PublicIntakeError("Student email is not valid.");
  if (!studentCell) throw new PublicIntakeError("Student phone is required.");
  if (!isValidPhone(studentCell)) throw new PublicIntakeError("Student phone is not valid.");

  const studentAddress = requireAddress("Student address", {
    addressLine1: raw.student?.addressLine1 ?? "",
    addressLine2: raw.student?.addressLine2,
    city: raw.student?.city ?? "",
    state: raw.student?.state ?? "",
    postalCode: raw.student?.postalCode ?? "",
  });

  const parent1 = requireContact("Parent 1", raw.parent1, true);
  const parent2Raw = raw.parent2;
  const parent2Present = Boolean(
    parent2Raw && (trim(parent2Raw.firstName) || trim(parent2Raw.lastName) || trim(parent2Raw.email)),
  );
  const parent2 = parent2Present ? requireContact("Parent 2", parent2Raw as ContactInput) : null;

  const parent1Mailing = resolveMailingAddress(
    "Parent 1 mailing address",
    raw.parent1,
    studentAddress,
    raw.householdAddress,
  );
  const parent2Mailing = parent2
    ? resolveMailingAddress("Parent 2 mailing address", parent2Raw as ContactInput, studentAddress)
    : null;
  const billingSameAsStudent = Boolean(raw.billing?.sameAsStudentAddress);
  const billingContact = {
    ...requireContact("Billing", raw.billing),
    ...(billingSameAsStudent ? studentAddress : requireAddress("Billing", raw.billing)),
  };

  const subjectCodes = Array.isArray(raw.subjectCodes)
    ? raw.subjectCodes.map((code) => trim(code)).filter(Boolean)
    : [];
  if (subjectCodes.length === 0) throw new PublicIntakeError("Select at least one subject.");
  if (subjectCodes.some((code) => !isValidOptionId("ACADEMIC_SUBJECTS", code))) {
    throw new PublicIntakeError("Invalid subject selection.");
  }
  const primarySubjectCode = trim(raw.primarySubjectCode);
  if (!primarySubjectCode) {
    throw new PublicIntakeError("Choose a primary subject so we can match a tutor.");
  }
  if (!subjectCodes.includes(primarySubjectCode)) {
    throw new PublicIntakeError("Primary subject must be one of the selected subjects.");
  }

  const referralSource = trim(raw.referralSource);
  if (!isValidOptionId("REFERRAL_SOURCE", referralSource)) {
    throw new PublicIntakeError("Please tell us how you heard about us.");
  }

  const testPrepInterests = Array.isArray(raw.testPrepInterests)
    ? raw.testPrepInterests.map((id) => trim(id)).filter(Boolean)
    : [];
  if (testPrepInterests.some((id) => !isValidOptionId("TEST_PREP_INTERESTS", id))) {
    throw new PublicIntakeError("Invalid test-prep selection.");
  }

  const paymentPlanId = trim(raw.paymentPlanId);
  if (!isValidOptionId("ACADEMIC_PAYMENT_PLANS", paymentPlanId)) {
    throw new PublicIntakeError("Select a payment plan.");
  }

  const hoursRatePackage = optional(raw.hoursRatePackage);
  const advancedHoursRatePackage = optional(raw.advancedHoursRatePackage);
  if (hoursRatePackage && !isValidOptionId("ACADEMIC_RATE_PACKAGES", hoursRatePackage)) {
    throw new PublicIntakeError("Invalid hours/rate selection.");
  }
  if (advancedHoursRatePackage && !isValidOptionId("ACADEMIC_ADVANCED_RATE_PACKAGES", advancedHoursRatePackage)) {
    throw new PublicIntakeError("Invalid advanced hours/rate selection.");
  }
  if (hoursRatePackage && advancedHoursRatePackage) {
    throw new PublicIntakeError("Choose a standard or advanced hours/rate package, not both.");
  }
  const selectedRatePackage = hoursRatePackage ?? advancedHoursRatePackage;
  if (!selectedRatePackage) {
    throw new PublicIntakeError("Choose an hours/rate package before payment.");
  }
  if (selectedRatePackage.endsWith("_hourly")) {
    throw new PublicIntakeError("Hourly Academic Year tutoring requires a staff-set amount before payment.");
  }

  const autoCharge = optional(raw.autoCharge);
  if (!isValidOptionId("YES_NO", autoCharge ?? "")) {
    throw new PublicIntakeError("Choose whether to automatically charge a card.");
  }
  const altPaymentMethod = autoCharge === "no" ? optional(raw.altPaymentMethod) : null;
  if (autoCharge === "no" && !isValidOptionId("ALT_PAYMENT_METHODS", altPaymentMethod ?? "")) {
    throw new PublicIntakeError("Choose an alternative payment method.");
  }

  if (raw.policyAck !== true || raw.agreementAck !== true) {
    throw new PublicIntakeError("Please acknowledge the policy and agreement.");
  }
  const parentSignature = trim(raw.parentSignature);
  const studentSignature = trim(raw.studentSignature);
  if (!parentSignature || !studentSignature) {
    throw new PublicIntakeError("Parent and student signatures are required.");
  }

  const schedulingPath = raw.schedulingPath;
  if (schedulingPath !== "family_selected" && schedulingPath !== "pt_chooses") {
    throw new PublicIntakeError("Choose a scheduling option.");
  }

  const preferredWindowIds = Array.isArray(raw.preferredWindowIds)
    ? raw.preferredWindowIds.map((id) => trim(id)).filter(Boolean)
    : [];
  if (preferredWindowIds.some((id) => !isValidOptionId("ACADEMIC_SCHEDULE_WINDOWS", id))) {
    throw new PublicIntakeError("Invalid preferred time.");
  }

  const staffBlock = await assertNotStaffAsGuardian({ email: parent1.email });
  if (staffBlock) throw new PublicIntakeError(staffBlock, 400, "staff_email");
  if (parent2) {
    const secondBlock = await assertNotStaffAsGuardian({ email: parent2.email });
    if (secondBlock) throw new PublicIntakeError(secondBlock, 400, "staff_email");
  }

  const subject = await resolveCatalogSubjectRow(primarySubjectCode);
  if (!subject) {
    throw new PublicIntakeError("That subject is not available yet. Please choose another or contact us.");
  }

  let preferredSlotId: string | null = null;
  let slotSnapshot: Record<string, unknown> = {};
  let scheduleWindowId: string | null = null;

  if (schedulingPath === "family_selected") {
    const windowId = trim(raw.windowId);
    const tutorId = trim(raw.tutorId);
    const slotId = trim(raw.slotId);
    if (!windowId || !tutorId || !slotId) {
      throw new PublicIntakeError("Choose a preferred tutor and time.");
    }
    if (!isValidOptionId("ACADEMIC_SCHEDULE_WINDOWS", windowId)) {
      throw new PublicIntakeError("Invalid preferred time window.");
    }
    const slot = await findOpenPreferredSlot({ slotId, tutorId, windowId });
    if (!slot) {
      throw new PublicIntakeError(
        "That time is no longer open. Please choose another.",
        409,
        "slot_unavailable",
      );
    }
    const database = requireDb();
    const [tutorRow] = await database
      .select({ displayName: tutors.displayName })
      .from(tutors)
      .where(eq(tutors.id, tutorId))
      .limit(1);
    preferredSlotId = slot.id;
    scheduleWindowId = slot.scheduleWindowId ?? windowId;
    slotSnapshot = {
      tutorId,
      slotId: slot.id,
      windowId,
      tutorDisplayName: tutorRow?.displayName ?? null,
      dayOfWeek: slot.dayOfWeek,
      startTimeLocal: slot.startTimeLocal,
      endTimeLocal: slot.endTimeLocal,
      openSeatsAtSubmit: slot.openSeats,
    };
  } else {
    if (preferredWindowIds.length === 0 && !optional(raw.scheduleNotes)) {
      throw new PublicIntakeError("Share at least one preferred time or a schedule note.");
    }
    scheduleWindowId = preferredWindowIds[0] ?? null;
  }

  const parent1Matches = await findHouseholdMatchCandidates({
    email: parent1.email,
    phone: parent1.phone,
  });
  const emailMatches = parent1Matches.filter(
    (row) => row.guardian.matchOn.includes("email") && row.householdStatus !== "archived",
  );
  const uniqueEmailHouseholds = new Set(emailMatches.map((row) => row.householdId));

  if (uniqueEmailHouseholds.size > 1) {
    throw new PublicIntakeError(
      "We found more than one family for this email. Please contact Professional Tutoring so we can place this registration correctly.",
      409,
      "ambiguous_identity",
    );
  }

  if (emailMatches.length === 0 && parent1Matches.length > 0) {
    throw new PublicIntakeError(
      "We found a possible existing family but could not match this email safely. Please contact Professional Tutoring rather than submitting again.",
      409,
      "ambiguous_identity",
    );
  }

  let identityReview: string | undefined;
  if (emailMatches.length === 1) identityReview = "student_unverified";

  let parent2Conflict = false;
  if (parent2) {
    const parent2Matches = await findHouseholdMatchCandidates({ email: parent2.email });
    const otherHousehold = parent2Matches.find(
      (row) =>
        row.guardian.matchOn.includes("email") &&
        row.householdStatus !== "archived" &&
        (emailMatches.length === 0 || row.householdId !== emailMatches[0]!.householdId),
    );
    if (otherHousehold) parent2Conflict = true;
  }

  const subjectLabels = ACADEMIC_SUBJECTS.options
    .filter((option) => subjectCodes.includes(option.id))
    .map((option) => option.label);
  const learningNeeds = [subjectLabels.join(", "), optional(raw.subjectNotes)].filter(Boolean).join(" — ");

  const billingEmailNorm = billingContact.email;
  const billingMatchesParent1 = billingEmailNorm === parent1.email;
  const billingMatchesParent2 = Boolean(parent2 && !parent2Conflict && billingEmailNorm === parent2.email);
  const billingIsSeparate = !billingMatchesParent1 && !billingMatchesParent2;

  const agreementAcceptedAt = new Date();
  const signedAt = agreementAcceptedAt.toISOString();
  const policy = await loadActiveCancellationPolicy();

  const database = requireDb();

  const result = await database.transaction(async (tx) => {
    let householdId: string;
    let requesterId: string;
    const invitePaths: Array<{ label: string; path: string }> = [];
    const now = new Date();

    if (emailMatches.length === 1) {
      const matched = emailMatches[0]!;
      householdId = matched.householdId;
      requesterId = matched.guardian.id;

      const existingGuardians = await tx
        .select({ id: guardians.id, email: guardians.email, inviteToken: guardians.inviteToken })
        .from(guardians)
        .where(eq(guardians.householdId, householdId));

      const matchedGuardian = existingGuardians.find((row) => row.id === requesterId);
      if (matchedGuardian?.inviteToken) {
        invitePaths.push({ label: "Parent 1", path: `/invite/${matchedGuardian.inviteToken}` });
      }

      if (parent2 && !parent2Conflict && existingGuardians.length < MAX_GUARDIANS_PER_HOUSEHOLD) {
        const already = existingGuardians.some(
          (row) => normalizeEmail(row.email) === parent2.email,
        );
        if (!already) {
          const token = inviteToken();
          await tx.insert(guardians).values({
            householdId,
            email: parent2.email,
            firstName: parent2.firstName,
            lastName: parent2.lastName,
            phone: parent2.phone ?? null,
            ...(parent2Mailing ? guardianAddressValues(parent2Mailing) : {}),
            relationshipRole: "parent_2",
            isBillingOwner: billingMatchesParent2,
            inviteToken: token,
            updatedAt: now,
          });
          invitePaths.push({ label: "Parent 2", path: `/invite/${token}` });
        }
      }
    } else {
      const displayName = buildHouseholdDisplayName({
        studentLastName: studentLast,
        billingLastName: billingContact.lastName,
        billingEmail: billingContact.email,
      });
      const [household] = await tx
        .insert(households)
        .values({
          displayName,
          displayNameManual: false,
          status: "pending",
          primaryPhone: parent1.phone ?? billingContact.phone ?? null,
          addressLine1: billingContact.addressLine1,
          addressLine2: billingContact.addressLine2,
          city: billingContact.city,
          state: billingContact.state,
          postalCode: billingContact.postalCode,
          country: HOUSEHOLD_COUNTRY_US,
          timezone: "America/New_York",
          autoCharge: autoCharge === "yes",
          updatedAt: now,
        })
        .returning({ id: households.id });

      householdId = household.id;
      const parent1Token = inviteToken();
      const parent1IsBilling = billingMatchesParent1 || billingIsSeparate;
      const [createdParent1] = await tx
        .insert(guardians)
        .values({
          householdId,
          email: parent1.email,
          firstName: parent1.firstName,
          lastName: parent1.lastName,
          phone: parent1.phone ?? null,
          ...guardianAddressValues(parent1Mailing),
          relationshipRole: "parent_1",
          isBillingOwner: parent1IsBilling,
          inviteToken: parent1Token,
          updatedAt: now,
        })
        .returning({ id: guardians.id });
      requesterId = createdParent1.id;
      invitePaths.push({ label: "Parent 1", path: `/invite/${parent1Token}` });

      let billingOwnerId = parent1IsBilling ? requesterId : null;
      if (parent2 && !parent2Conflict) {
        const parent2Token = inviteToken();
        const [createdParent2] = await tx
          .insert(guardians)
          .values({
            householdId,
            email: parent2.email,
            firstName: parent2.firstName,
            lastName: parent2.lastName,
            phone: parent2.phone ?? null,
            ...(parent2Mailing ? guardianAddressValues(parent2Mailing) : {}),
            relationshipRole: "parent_2",
            isBillingOwner: billingMatchesParent2,
            inviteToken: parent2Token,
            updatedAt: now,
          })
          .returning({ id: guardians.id });
        invitePaths.push({ label: "Parent 2", path: `/invite/${parent2Token}` });
        if (billingMatchesParent2) billingOwnerId = createdParent2.id;
      }

      if (billingOwnerId) {
        await tx
          .update(households)
          .set({ billingOwnerGuardianId: billingOwnerId, updatedAt: now })
          .where(eq(households.id, householdId));
      }
    }

    if (parent2Conflict) identityReview = identityReview ? `${identityReview},second_guardian_conflict` : "second_guardian_conflict";

    const [student] = await tx
      .insert(students)
      .values({
        householdId,
        displayName: `${studentFirst} ${studentLast}`.trim(),
        firstName: studentFirst,
        lastName: studentLast,
        schoolName,
        gradeLabel,
        graduationYear: Number.parseInt(graduationYear, 10),
        gender,
        birthdate,
        cellPhone: studentCell,
        email: studentEmail,
        supportNotesRestricted: supportNotes,
        description: otherInformation,
        learningNeeds: learningNeeds || null,
        hoursRatePackage,
        advancedHoursRatePackage,
        paymentPlan: paymentPlanId,
        lifecycle: "prospect",
        addressLine1: studentAddress.addressLine1,
        addressLine2: studentAddress.addressLine2,
        city: studentAddress.city,
        state: studentAddress.state,
        postalCode: studentAddress.postalCode,
        country: HOUSEHOLD_COUNTRY_US,
        updatedAt: now,
      })
      .returning({ id: students.id });

    const payload: Record<string, unknown> = {
      source: "public_ay_tutoring",
      schedulingPath,
      catalogSubjectCode: primarySubjectCode,
      additionalSubjectCodes: subjectCodes.filter((code) => code !== primarySubjectCode),
      testPrepInterests,
      preferredWindowIds: schedulingPath === "pt_chooses" ? preferredWindowIds : scheduleWindowId ? [scheduleWindowId] : [],
      hoursRatePackage,
      advancedHoursRatePackage,
      autoChargePreference: autoCharge,
      altPaymentMethod,
      billingContact: {
        firstName: billingContact.firstName,
        lastName: billingContact.lastName,
        email: billingContact.email,
        phone: billingContact.phone ?? null,
        addressLine1: billingContact.addressLine1,
        addressLine2: billingContact.addressLine2,
        city: billingContact.city,
        state: billingContact.state,
        postalCode: billingContact.postalCode,
      },
      billingContactIsSeparate: billingIsSeparate,
      householdAddress: parent1Mailing,
      parent1Mailing,
      parent2Mailing,
      otherInformation,
      signatures: {
        parentTypedName: parentSignature,
        studentTypedName: studentSignature,
        signedAt,
      },
      policyAcknowledgement: {
        code: policy.code,
        acceptedAt: signedAt,
      },
      supportNotesRestricted: supportNotes,
      birthdate,
      ...(identityReview ? { identityReview } : {}),
      ...(emailMatches.length === 1 ? { matchOn: ["email"], reusedHouseholdId: householdId } : {}),
      ...(parent2Conflict ? { omittedParent2: true } : {}),
      ...slotSnapshot,
    };

    const request = await createTutoringRequest(
      {
        householdId,
        studentId: student.id,
        subjectId: subject.id,
        requestedByGuardianId: requesterId,
        status: "pending_staff_review",
        preferredSlotId,
        scheduleNotes: optional(raw.scheduleNotes),
        subjectNotes: optional(raw.subjectNotes),
        referralSource,
        packageLabel: paymentPlanId,
        policyVersionId: null,
        agreementAcceptedAt,
        formId: "academic_year_tutoring",
        scheduleWindowId,
        paymentPlanId,
        payload,
      },
      tx,
    );

    return {
      householdId,
      studentId: student.id,
      tutoringRequestId: request.id,
      invitePaths,
      schedulingPath,
      preferredSlotId,
    };
  });
  const payment = await createAyPublicPaymentContinuation({
    householdId: result.householdId,
    tutoringRequestId: result.tutoringRequestId,
    schedulingPath,
    paymentPlanId,
    hoursRatePackage,
    advancedHoursRatePackage,
    autoCharge: autoCharge as "yes" | "no",
    altPaymentMethod,
  });

  return {
    ...result,
    payment,
    message:
      schedulingPath === "family_selected"
        ? "We received your registration and saved your preferred time. Your place is confirmed after payment in a later step."
        : "We received your registration. We’ll match a tutor and time, and you’ll hear from Professional Tutoring.",
  };
}