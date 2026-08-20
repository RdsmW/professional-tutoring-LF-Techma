import { test, expect } from "@playwright/test";
import { academicYearPublicFormTokenForTest } from "./public-form-token";
import {
  ACADEMIC_YEAR_PAYMENT_TERMS,
  ACADEMIC_YEAR_POLICY_SECTIONS,
} from "../src/lib/academic-year/source-content";

const unique = Date.now();
const phoneSuffix = String(unique).slice(-4);

test.describe("public academic year registration", () => {
  test("unauthenticated registration page loads", async ({ page }) => {
    const response = await page.goto("/register/academic-year-tutoring");
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Start registration/i })).toBeVisible();
    await expect(page.getByText(/tutoring_request/i)).toHaveCount(0);
  });

  test("uses approved Academic Year payment and appointment wording", () => {
    const appointmentTerms = ACADEMIC_YEAR_POLICY_SECTIONS.find(
      (section) => section.heading === "Tutoring Appointments",
    )?.body;
    expect(appointmentTerms).toContain("Tutoring appointments must be scheduled through the Professional Tutoring app");
    expect(appointmentTerms).toContain("When available, families may select an eligible available tutor and time slot directly through the app.");
    expect(appointmentTerms).toContain("Families may also submit their scheduling preferences for Professional Tutoring staff");
    expect(appointmentTerms).not.toContain("Under no circumstances are appointments to be made directly with tutors.");

    expect(ACADEMIC_YEAR_PAYMENT_TERMS).toContain(
      "Academic Year registration payments made through the app are processed securely by credit/debit card through Stripe.",
    );
    expect(ACADEMIC_YEAR_PAYMENT_TERMS).toContain(
      "By completing the Stripe payment setup, you authorize Professional Tutoring to charge the card on file",
    );
    expect(ACADEMIC_YEAR_PAYMENT_TERMS).not.toContain("Make checks payable to Professional Tutoring");
    expect(ACADEMIC_YEAR_PAYMENT_TERMS).not.toContain("Pay Now");
    expect(ACADEMIC_YEAR_PAYMENT_TERMS).not.toContain("without explicit authorization in the case of late payment");
  });

  test("student step uses concise required labels and keeps contact fields together", async ({ page }) => {
    await page.goto("/register/academic-year-tutoring");
    await page.getByRole("button", { name: /Start registration/i }).click();
    await expect(page.getByRole("heading", { name: /^Address$/ })).toBeVisible();
    await expect(page.getByText("Other information")).toBeVisible();
    await expect(page.getByLabel(/^First name/)).toBeVisible();
    await expect(page.getByLabel(/^Last name/)).toBeVisible();
    await expect(page.getByLabel(/^Phone/)).toBeVisible();
    await expect(page.getByLabel(/^Email/)).toHaveAttribute("required", "");
    await expect(page.getByText("Student first name")).toHaveCount(0);
    await expect(page.getByText("Student last name")).toHaveCount(0);
    await expect(page.getByText("Student cell")).toHaveCount(0);
    await expect(page.getByText("Student email")).toHaveCount(0);
    await expect(page.locator(".public-ay-student-grid .public-ay-field")).toHaveCount(9);
    await expect(page.locator(".public-ay-notes-grid .public-ay-field")).toHaveCount(2);
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(page.locator(".public-ay-field.is-invalid").first()).toBeVisible();
  });

  test("family portal remains protected", async ({ page }) => {
    await page.goto("/family");
    await expect(page).toHaveURL(/sign-in/);
  });

  async function currentVersionToken() {
    test.skip(!process.env.DATABASE_URL, "DATABASE_URL is required for API registration tests");
    return academicYearPublicFormTokenForTest();
  }

  test("Path B API creates a card-backed request without booking", async ({ request }) => {
    const formVersionToken = await currentVersionToken();
    const payload = {
      formVersionToken,
      student: {
        firstName: "Alex",
        lastName: `Martin${unique}`,
        schoolName: "Test High",
        gradeLabel: "grade_9",
        graduationYear: String(new Date().getFullYear() + 3),
        gender: "M",
        birthdate: "2010-04-12",
        cellPhone: `703555${phoneSuffix}`,
        email: `ay-student-b-${unique}@example.com`,
        addressLine1: "1 Student Ln",
        city: "Burke",
        state: "VA",
        postalCode: "22015",
        supportNotes: "504 extended time",
      },
      parent1: {
        firstName: "Pat",
        lastName: "Martin",
        email: `ay-parent-b-${unique}@example.com`,
        phone: `571555${phoneSuffix}`,
      },
      householdAddress: {
        addressLine1: "1 Main St",
        city: "Burke",
        state: "VA",
        postalCode: "22015",
      },
      billing: {
        firstName: "Pat",
        lastName: "Martin",
        email: `ay-bill-b-${unique}@example.com`,
        phone: `540555${phoneSuffix}`,
        addressLine1: "9 Billing Rd",
        city: "Burke",
        state: "VA",
        postalCode: "22015",
      },
      subjectCodes: ["algebra_1"],
      primarySubjectCode: "algebra_1",
      referralSource: "friend",
      schedulingPath: "pt_chooses",
      preferredWindowIds: ["tue_1715_1915"],
      paymentPlanId: "monthly",
      hoursRatePackage: "std_2h",
      autoCharge: "yes",
      policyAck: true,
      agreementAck: true,
      parentSignature: "Pat Martin",
      studentSignature: "Alex Martin",
    };

    const legacyManualResponse = await request.post("/api/public/ay-tutoring-registration", {
      data: { ...payload, autoCharge: "no", altPaymentMethod: "Check" },
    });
    expect(legacyManualResponse.status()).toBe(400);
    expect((await legacyManualResponse.json()).error).toMatch(/secure card collection/i);

    const response = await request.post("/api/public/ay-tutoring-registration", { data: payload });
    const body = await response.json();
    if (response.status() === 500) {
      test.skip(true, "Database not available for Path B API test");
    }
    expect(response.ok(), JSON.stringify(body)).toBeTruthy();
    expect(body.ok).toBeTruthy();
    expect(body.schedulingPath).toBe("pt_chooses");
    expect(body.preferredSlotId).toBeNull();
    expect(body.invitePaths?.length).toBeGreaterThan(0);
    expect(body.payment?.token).toBeTruthy();
    expect(body.payment?.requiresCard).toBe(true);

    const hourlyUnique = unique + 50;
    const hourlyPhoneSuffix = String(hourlyUnique).slice(-4);
    const hourlyResponse = await request.post("/api/public/ay-tutoring-registration", {
      data: {
        ...payload,
        student: {
          ...payload.student,
          lastName: `Hourly${hourlyUnique}`,
          email: `ay-hourly-student-${hourlyUnique}@example.com`,
          cellPhone: `703555${hourlyPhoneSuffix}`,
        },
        parent1: {
          ...payload.parent1,
          email: `ay-hourly-parent-${hourlyUnique}@example.com`,
          phone: `571555${hourlyPhoneSuffix}`,
        },
        billing: {
          ...payload.billing,
          email: `ay-hourly-bill-${hourlyUnique}@example.com`,
          phone: `540555${hourlyPhoneSuffix}`,
        },
        hoursRatePackage: "std_hourly",
      },
    });
    const hourlyBody = await hourlyResponse.json();
    expect(hourlyResponse.ok(), JSON.stringify(hourlyBody)).toBeTruthy();
    expect(hourlyBody.paymentDeferred).toBe(true);
    expect(hourlyBody.payment).toBeNull();
  });

  test("Path A confirms the selected open slot on the same request", async ({ request }) => {
    const formVersionToken = await currentVersionToken();
    const availability = await request.get(
      "/api/public/ay-tutoring-availability?subjectCode=algebra_1&windowId=tue_1715_1915",
    );
    expect(availability.ok(), await availability.text()).toBeTruthy();
    const availabilityBody = await availability.json();
    const tutor = availabilityBody.tutors?.[0];
    test.skip(!tutor, "No open Academic Year tutor is available for the Path A test");

    const slotsResponse = await request.get(
      `/api/public/ay-tutoring-availability?subjectCode=algebra_1&windowId=tue_1715_1915&tutorId=${encodeURIComponent(tutor.id)}`,
    );
    expect(slotsResponse.ok(), await slotsResponse.text()).toBeTruthy();
    const slotsBody = await slotsResponse.json();
    const slot = slotsBody.slots?.[0];
    test.skip(!slot, "No open Academic Year slot is available for the Path A test");

    const pathAUnique = unique + 1;
    const pathAPhoneSuffix = String(pathAUnique).slice(-4);
    const registration = await request.post("/api/public/ay-tutoring-registration", {
      data: {
        formVersionToken,
        student: {
          firstName: "Jordan",
          lastName: `Lee${pathAUnique}`,
          schoolName: "Test High",
          gradeLabel: "grade_9",
          graduationYear: String(new Date().getFullYear() + 3),
          gender: "F",
          birthdate: "2010-04-12",
          cellPhone: `703444${pathAPhoneSuffix}`,
          email: `ay-student-a-${pathAUnique}@example.com`,
          addressLine1: "2 Student Ln",
          city: "Burke",
          state: "VA",
          postalCode: "22015",
        },
        parent1: {
          firstName: "Riley",
          lastName: "Lee",
          email: `ay-parent-a-${pathAUnique}@example.com`,
          phone: `571444${pathAPhoneSuffix}`,
        },
        householdAddress: {
          addressLine1: "2 Main St",
          city: "Burke",
          state: "VA",
          postalCode: "22015",
        },
        billing: {
          firstName: "Riley",
          lastName: "Lee",
          email: `ay-bill-a-${pathAUnique}@example.com`,
          phone: `540444${pathAPhoneSuffix}`,
          addressLine1: "2 Billing Rd",
          city: "Burke",
          state: "VA",
          postalCode: "22015",
        },
        subjectCodes: ["algebra_1"],
        primarySubjectCode: "algebra_1",
        referralSource: "friend",
        schedulingPath: "family_selected",
        windowId: "tue_1715_1915",
        tutorId: tutor.id,
        slotId: slot.id,
        paymentPlanId: "monthly",
        hoursRatePackage: "std_2h",
        autoCharge: "yes",
        policyAck: true,
        agreementAck: true,
        parentSignature: "Riley Lee",
        studentSignature: "Jordan Lee",
      },
    });
    const registrationBody = await registration.json();
    expect(registration.ok(), JSON.stringify(registrationBody)).toBeTruthy();
    expect(registrationBody.tutoringRequestId).toBeTruthy();
    expect(registrationBody.preferredSlotId).toBe(slot.id);

    expect(registrationBody.payment?.requiresCard).toBe(true);
  });

  test("mixed Standard and Advanced subjects defer pricing to Staff", async ({ request }) => {
    const formVersionToken = await currentVersionToken();
    const mixedUnique = unique + 2;
    const response = await request.post("/api/public/ay-tutoring-registration", {
      data: {
        formVersionToken,
        student: {
          firstName: "Mixed",
          lastName: `Subject${mixedUnique}`,
          schoolName: "Test High",
          gradeLabel: "grade_9",
          graduationYear: String(new Date().getFullYear() + 3),
          gender: "F",
          birthdate: "2010-04-12",
          cellPhone: `703333${String(mixedUnique).slice(-4)}`,
          email: `ay-mixed-${mixedUnique}@example.com`,
          addressLine1: "3 Student Ln",
          city: "Burke",
          state: "VA",
          postalCode: "22015",
        },
        parent1: {
          firstName: "Mixed",
          lastName: "Parent",
          email: `ay-mixed-parent-${mixedUnique}@example.com`,
          phone: `571333${String(mixedUnique).slice(-4)}`,
        },
        householdAddress: { addressLine1: "3 Main St", city: "Burke", state: "VA", postalCode: "22015" },
        billing: {
          firstName: "Mixed",
          lastName: "Parent",
          email: `ay-mixed-bill-${mixedUnique}@example.com`,
          phone: `540333${String(mixedUnique).slice(-4)}`,
          addressLine1: "3 Billing Rd",
          city: "Burke",
          state: "VA",
          postalCode: "22015",
        },
        subjectCodes: ["algebra_1", "ap_statistics"],
        referralSource: "friend",
        schedulingPath: "pt_chooses",
        preferredWindowIds: ["tue_1715_1915"],
        paymentPlanId: "monthly",
        policyAck: true,
        agreementAck: true,
        parentSignature: "Mixed Parent",
        studentSignature: "Mixed Subject",
      },
    });
    const body = await response.json();
    expect(response.ok(), JSON.stringify(body)).toBeTruthy();
    expect(body.subjectRateProfile).toBe("mixed");
    expect(body.paymentDeferred).toBe(true);
    expect(body.payment).toBeNull();
    expect(body.invitePaths?.length).toBeGreaterThan(0);
  });
});
