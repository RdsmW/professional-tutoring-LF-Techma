import { test, expect } from "@playwright/test";
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";

const familyEmail = process.env.E2E_CLERK_FAMILY_EMAIL;
const familyPassword = process.env.E2E_CLERK_FAMILY_PASSWORD;
const hasFamilyAuth = Boolean(familyEmail && familyPassword);

test.describe("book/enroll options + referral API", () => {
  test.skip(!hasFamilyAuth, "Set E2E_CLERK_FAMILY_EMAIL and E2E_CLERK_FAMILY_PASSWORD");

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await clerk.signIn({
      page,
      signInParams: {
        strategy: "password",
        identifier: familyEmail!,
        password: familyPassword!,
      },
    });
  });

  test("book-tutoring options load", async ({ page }) => {
    const response = await page.request.get("/api/family/book-tutoring/options");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBeTruthy();
  });

  test("enroll-courses options load", async ({ page }) => {
    const response = await page.request.get("/api/family/enroll-courses/options");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBeTruthy();
  });

  test("book-tutoring rejects invalid referral_source", async ({ page }) => {
    const response = await page.request.post("/api/family/book-tutoring", {
      data: {
        studentId: "00000000-0000-0000-0000-000000000001",
        formId: "academic_year_tutoring",
        subjectCode: "Algebra 1",
        windowId: "tue_1515_1715",
        tutorId: "00000000-0000-0000-0000-000000000002",
        slotId: "00000000-0000-0000-0000-000000000003",
        paymentPlanId: "std_2h",
        policyAck: true,
        referralSource: "not-a-real-referral",
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    const data = await response.json();
    expect(data.ok).toBeFalsy();
  });
});
