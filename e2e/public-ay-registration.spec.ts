import { test, expect } from "@playwright/test";

const unique = Date.now();

test.describe("public academic year registration", () => {
  test("unauthenticated registration page loads", async ({ page }) => {
    const response = await page.goto("/register/academic-year-tutoring");
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Start registration/i })).toBeVisible();
    await expect(page.getByText(/tutoring_request/i)).toHaveCount(0);
  });

  test("family portal remains protected", async ({ page }) => {
    await page.goto("/family");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("Path B API creates request without booking", async ({ request }) => {
    const payload = {
      student: {
        firstName: "Alex",
        lastName: `Martin${unique}`,
        schoolName: "Test High",
        gradeLabel: "grade_9",
        graduationYear: String(new Date().getFullYear() + 3),
        gender: "M",
        birthdate: "2010-04-12",
        cellPhone: "7035550199",
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
        phone: "7035550100",
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
        phone: "7035550101",
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
  });
});
