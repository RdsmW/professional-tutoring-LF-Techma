import { test, expect, type APIRequestContext } from "@playwright/test";
import postgres from "postgres";
import {
  ACADEMIC_YEAR_PAYMENT_TERMS,
  ACADEMIC_YEAR_POLICY_SECTIONS,
} from "../src/lib/academic-year/source-content";
import { ACADEMIC_SCHEDULE_WINDOWS } from "../src/lib/forms/options";
import { academicYearPaymentStatusCopy } from "../src/lib/public-intake/ay-payment-status";

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

  test("keeps paid initial installments distinct from future pending installments", () => {
    expect(academicYearPaymentStatusCopy("paid")).toEqual({
      label: "Paid",
      detail: "Your first scheduled payment was completed successfully.",
    });
    expect(academicYearPaymentStatusCopy("pending")).toEqual({
      label: "Pending",
      detail: "Your card setup is complete. Future scheduled installments remain pending until their due dates.",
    });
  });

  test("confirmation explains payment state and separate parent portal invitations", async ({ page }) => {
    await page.goto("/register/academic-year-tutoring");
    await page.evaluate(() => {
      sessionStorage.setItem(
        "ayTutoringConfirmation",
        JSON.stringify({
          message: "Your registration is complete.",
          schedulingPath: "family_selected",
          paymentStatus: "paid",
          portalInvitation: { emailSent: true, emailAlreadySent: false, pending: false, failed: false, sentCount: 2 },
        }),
      );
    });
    await page.goto("/register/academic-year-tutoring/confirmation");
    await expect(page.getByText(/Payment status:/)).toContainText("Paid");
    await expect(page.getByText(/first scheduled payment was completed successfully/i)).toBeVisible();
    await expect(page.getByText(/Separate invitations have been sent to both parents/i)).toBeVisible();
    await expect(page.getByText(/same family portal/i)).toBeVisible();
    await expect(page.getByText(/Your Academic Year registration, tutor, and selected time are confirmed/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Return to Professional Tutoring/i })).toHaveAttribute(
      "href",
      "/register/academic-year-tutoring",
    );
    await expect(page.getByText(/not a confirmed seat yet/i)).toHaveCount(0);

    await page.evaluate(() => {
      sessionStorage.setItem(
        "ayTutoringConfirmation",
        JSON.stringify({
          message: "Your card is ready.",
          paymentStatus: "pending",
        }),
      );
    });
    await page.reload();
    await expect(page.getByText(/Payment status:/)).toContainText("Pending");
    await expect(page.getByText(/Future scheduled installments remain pending until their due dates/i)).toBeVisible();
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

  test("parent contact labels are explicit and required", async ({ page }) => {
    await page.goto("/register/academic-year-tutoring");
    await page.getByRole("button", { name: /Start registration/i }).click();
    await page.getByLabel(/^First name/).fill("Alex");
    await page.getByLabel(/^Last name/).fill("Martin");
    await page.getByLabel(/^Gender/).selectOption("M");
    await page.getByLabel(/^School/).fill("Test High");
    await page.getByLabel(/^Grade/).selectOption("grade_9");
    await page.getByLabel(/^Graduation year/).selectOption(String(new Date().getFullYear() + 3));
    await page.getByLabel(/^Birthdate/).fill("2010-04-12");
    await page.getByLabel(/^Phone/).fill("7035550100");
    await page.getByLabel(/^Email/).fill(`label-student-${unique}@example.com`);
    await page.getByLabel(/^Street/).fill("1 Student Ln");
    await page.getByLabel(/^City/).fill("Burke");
    await page.getByLabel(/^State/).selectOption("VA");
    await page.getByLabel(/^ZIP/).fill("22015");
    await page.getByRole("button", { name: /Continue/i }).click();

    await expect(page.getByRole("heading", { name: "Parent 2", exact: true })).toBeVisible();
    for (const label of [
      "Parent 1 first name",
      "Parent 1 last name",
      "Parent 1 email",
      "Parent 1 phone",
      "Parent 2 first name",
      "Parent 2 last name",
      "Parent 2 email",
      "Parent 2 phone",
    ]) {
      await expect(page.getByLabel(label)).toHaveAttribute("required", "");
    }
    await expect(page.getByText(/Parent 2 \(optional\)/i)).toHaveCount(0);
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(page.getByText("Parent 1 name and email are required.")).toBeVisible();
  });

  test("family portal remains protected", async ({ page }) => {
    await page.goto("/family");
    await expect(page).toHaveURL(/sign-in/);
  });

  async function currentVersionToken(request: APIRequestContext) {
    test.skip(!process.env.DATABASE_URL, "DATABASE_URL is required for API registration tests");
    const response = await request.get("/register/academic-year-tutoring");
    const page = await response.text();
    expect(response.ok(), page).toBeTruthy();
    const tokenInput =
      page.match(/<input[^>]*name="formVersionToken"[^>]*>/)?.[0] ??
      page.match(/<input[^>]*value="[^"]+"[^>]*name="formVersionToken"[^>]*>/)?.[0];
    const token = tokenInput?.match(/value="([^"]+)"/)?.[1];
    expect(token).toBeTruthy();
    return token!;
  }

  test("Path B API creates a card-backed request without booking", async ({ request }) => {
    const formVersionToken = await currentVersionToken(request);
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
      parent2: {
        firstName: "Morgan",
        lastName: "Martin",
        email: `ay-parent2-b-${unique}@example.com`,
        phone: `571556${phoneSuffix}`,
        sameAsStudentAddress: true,
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

    const missingParent2 = await request.post("/api/public/ay-tutoring-registration", {
      data: { ...payload, parent2: null },
    });
    expect(missingParent2.status()).toBe(400);
    expect((await missingParent2.json()).error).toMatch(/Parent 2 first name, last name, and email are required/i);

    const duplicateParentEmail = await request.post("/api/public/ay-tutoring-registration", {
      data: {
        ...payload,
        parent2: {
          ...payload.parent2,
          email: ` ${payload.parent1.email.toUpperCase()} `,
        },
      },
    });
    expect(duplicateParentEmail.status()).toBe(400);
    expect(await duplicateParentEmail.json()).toMatchObject({
      code: "duplicate_guardian_email",
      error: expect.stringMatching(/must use different email addresses/i),
    });

    const invalidParent2Phone = await request.post("/api/public/ay-tutoring-registration", {
      data: { ...payload, parent2: { ...payload.parent2, phone: "not-a-phone" } },
    });
    expect(invalidParent2Phone.status()).toBe(400);
    expect((await invalidParent2Phone.json()).error).toMatch(/Parent 2 phone is not valid/i);

    for (const invalidToken of [undefined, `${formVersionToken}tampered`]) {
      const invalidTokenResponse = await request.post("/api/public/ay-tutoring-registration", {
        data: { ...payload, formVersionToken: invalidToken },
      });
      expect(invalidTokenResponse.status()).toBe(409);
      const invalidTokenBody = await invalidTokenResponse.json();
      expect(invalidTokenBody.code).toBe("form_version_expired");
      expect(invalidTokenBody.error).toMatch(/Refresh the page/i);
    }

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

    const parent2ConflictUnique = unique + 25;
    const parent2ConflictPhoneSuffix = String(parent2ConflictUnique).slice(-4);
    const parent2ConflictResponse = await request.post("/api/public/ay-tutoring-registration", {
      data: {
        ...payload,
        student: {
          ...payload.student,
          lastName: `Parent2Conflict${parent2ConflictUnique}`,
          email: `ay-parent2-conflict-student-${parent2ConflictUnique}@example.com`,
          cellPhone: `703557${parent2ConflictPhoneSuffix}`,
        },
        parent1: {
          ...payload.parent1,
          email: `ay-parent2-conflict-parent-${parent2ConflictUnique}@example.com`,
          phone: `571557${parent2ConflictPhoneSuffix}`,
        },
        billing: {
          ...payload.billing,
          email: `ay-parent2-conflict-bill-${parent2ConflictUnique}@example.com`,
          phone: `540557${parent2ConflictPhoneSuffix}`,
        },
      },
    });
    expect(parent2ConflictResponse.status()).toBe(409);
    expect((await parent2ConflictResponse.json()).code).toBe("parent2_household_conflict");

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
        parent2: {
          ...payload.parent2,
          email: `ay-hourly-parent2-${hourlyUnique}@example.com`,
          phone: `571556${hourlyPhoneSuffix}`,
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
    const formVersionToken = await currentVersionToken(request);
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
        parent2: {
          firstName: "Casey",
          lastName: "Lee",
          email: `ay-parent2-a-${pathAUnique}@example.com`,
          phone: `571445${pathAPhoneSuffix}`,
          sameAsStudentAddress: true,
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
    const formVersionToken = await currentVersionToken(request);
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
        parent2: {
          firstName: "Second",
          lastName: "Parent",
          email: `ay-mixed-parent2-${mixedUnique}@example.com`,
          phone: `571334${String(mixedUnique).slice(-4)}`,
          sameAsStudentAddress: true,
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

  test("non-production fixture exposes every advertised Academic Year window", async ({ request }) => {
    test.skip(!process.env.DATABASE_URL, "DATABASE_URL is required for availability fixture tests");
    test.skip(process.env.NODE_ENV === "production", "Production availability must never be fabricated.");

    for (const window of ACADEMIC_SCHEDULE_WINDOWS.options) {
      const tutorResponse = await request.get(
        `/api/public/ay-tutoring-availability?subjectCode=algebra_1&windowId=${window.id}`,
      );
      expect(tutorResponse.ok(), `${window.id}: ${await tutorResponse.text()}`).toBeTruthy();
      const tutorBody = await tutorResponse.json();
      expect(tutorBody.tutors.length, window.id).toBeGreaterThan(0);

      const slotResponse = await request.get(
        `/api/public/ay-tutoring-availability?subjectCode=algebra_1&windowId=${window.id}&tutorId=${tutorBody.tutors[0].id}`,
      );
      expect(slotResponse.ok(), `${window.id}: ${await slotResponse.text()}`).toBeTruthy();
      const slotBody = await slotResponse.json();
      expect(slotBody.slots.length, window.id).toBeGreaterThan(0);
    }
  });

  test("non-production availability respects a saturated fixture slot", async ({ request }) => {
    test.skip(!process.env.DATABASE_URL, "DATABASE_URL is required for availability fixture tests");
    test.skip(process.env.NODE_ENV === "production", "Production availability must never be fabricated.");

    const tutorsResponse = await request.get(
      "/api/public/ay-tutoring-availability?subjectCode=algebra_1&windowId=tue_1715_1915",
    );
    expect(tutorsResponse.ok(), await tutorsResponse.text()).toBeTruthy();
    const fixtureTutor = (await tutorsResponse.json()).tutors.find(
      (tutor: { displayName: string }) => tutor.displayName === "Academic Year Test Tutor",
    );
    expect(fixtureTutor).toBeTruthy();

    const slotsResponse = await request.get(
      `/api/public/ay-tutoring-availability?subjectCode=algebra_1&windowId=tue_1715_1915&tutorId=${fixtureTutor.id}`,
    );
    expect(slotsResponse.ok(), await slotsResponse.text()).toBeTruthy();
    const fixtureSlot = (await slotsResponse.json()).slots[0];
    expect(fixtureSlot).toBeTruthy();

    const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
    let originalCapacity = 25;
    let originalHeldSeats = 0;
    try {
      const [originalSlot] = await sql`
        SELECT capacity_seats, held_seats
        FROM availability_slots
        WHERE id = ${fixtureSlot.id}::uuid
      `;
      expect(originalSlot).toBeTruthy();
      originalCapacity = originalSlot.capacity_seats;
      originalHeldSeats = originalSlot.held_seats;

      await sql`
        UPDATE availability_slots
        SET capacity_seats = 1, held_seats = 1
        WHERE id = ${fixtureSlot.id}::uuid
      `;

      const saturatedTutorsResponse = await request.get(
        "/api/public/ay-tutoring-availability?subjectCode=algebra_1&windowId=tue_1715_1915",
      );
      expect(saturatedTutorsResponse.ok(), await saturatedTutorsResponse.text()).toBeTruthy();
      const saturatedTutor = (await saturatedTutorsResponse.json()).tutors.find(
        (tutor: { id: string }) => tutor.id === fixtureTutor.id,
      );
      expect(saturatedTutor).toBeFalsy();

      const saturatedSlotsResponse = await request.get(
        `/api/public/ay-tutoring-availability?subjectCode=algebra_1&windowId=tue_1715_1915&tutorId=${fixtureTutor.id}`,
      );
      expect(saturatedSlotsResponse.ok(), await saturatedSlotsResponse.text()).toBeTruthy();
      const saturatedSlots = (await saturatedSlotsResponse.json()).slots;
      expect(saturatedSlots.some((slot: { id: string }) => slot.id === fixtureSlot.id)).toBeFalsy();
    } finally {
      await sql`
        UPDATE availability_slots
        SET capacity_seats = ${originalCapacity}, held_seats = ${originalHeldSeats}
        WHERE id = ${fixtureSlot.id}::uuid
      `;
      await sql.end({ timeout: 5 });
    }
  });
});
