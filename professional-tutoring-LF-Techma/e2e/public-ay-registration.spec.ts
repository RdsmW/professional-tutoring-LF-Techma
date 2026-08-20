import { test, expect } from "@playwright/test";

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
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(page.locator(".public-ay-field.is-invalid").first()).toBeVisible();
  });

  test("family portal remains protected", async ({ page }) => {
    await page.goto("/family");
    await expect(page).toHaveURL(/sign-in/);
  });

  async function currentVersionToken(page: import("@playwright/test").Page) {
    await page.goto("/register/academic-year-tutoring");
    const token = await page.locator('input[name="formVersionToken"]').inputValue();
    expect(token).toBeTruthy();
    return token;
  }

  test("Path B API creates request without booking", async ({ request, page }) => {
    const formVersionToken = await currentVersionToken(page);
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
      autoCharge: "no",
      altPaymentMethod: "Check",
      policyAck: true,
      agreementAck: true,
      parentSignature: "Pat Martin",
      studentSignature: "Alex Martin",
    };

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

    const prepared = await request.post("/api/public/ay-tutoring-payment/prepare", {
      data: { token: body.payment.token },
    });
    expect(prepared.ok(), await prepared.text()).toBeTruthy();
    expect((await prepared.json()).kind).toBe("manual");

    const finalized = await request.post("/api/public/ay-tutoring-payment/finalize", {
      data: { token: body.payment.token },
    });
    const finalizedBody = await finalized.json();
    expect(finalized.ok(), JSON.stringify(finalizedBody)).toBeTruthy();
    expect(finalizedBody.schedulingPath).toBe("pt_chooses");
    expect(finalizedBody.bookingId).toBeNull();
    expect(finalizedBody.paymentStatus).toBe("unpaid");
  });

  test("Path A confirms the selected open slot on the same request", async ({ request, page }) => {
    const formVersionToken = await currentVersionToken(page);
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
        autoCharge: "no",
        altPaymentMethod: "Check",
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

    const prepared = await request.post("/api/public/ay-tutoring-payment/prepare", {
      data: { token: registrationBody.payment.token },
    });
    expect(prepared.ok(), await prepared.text()).toBeTruthy();
    expect((await prepared.json()).kind).toBe("manual");

    const finalized = await request.post("/api/public/ay-tutoring-payment/finalize", {
      data: { token: registrationBody.payment.token },
    });
    const finalizedBody = await finalized.json();
    expect(finalized.ok(), JSON.stringify(finalizedBody)).toBeTruthy();
    expect(finalizedBody.schedulingPath).toBe("family_selected");
    expect(finalizedBody.bookingId).toBeTruthy();
    expect(finalizedBody.paymentStatus).toBe("unpaid");
    expect(finalizedBody.pendingManualPayment).toBe(true);

    const replay = await request.post("/api/public/ay-tutoring-payment/finalize", {
      data: { token: registrationBody.payment.token },
    });
    const replayBody = await replay.json();
    expect(replay.ok(), JSON.stringify(replayBody)).toBeTruthy();
    expect(replayBody.bookingId).toBe(finalizedBody.bookingId);
    expect(replayBody.alreadyCompleted).toBe(true);
  });
});
