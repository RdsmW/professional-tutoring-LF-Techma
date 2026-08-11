import { test, expect } from "@playwright/test";
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";

const familyEmail = process.env.E2E_CLERK_FAMILY_EMAIL;
const familyPassword = process.env.E2E_CLERK_FAMILY_PASSWORD;
const staffEmail = process.env.E2E_CLERK_STAFF_EMAIL;
const staffPassword = process.env.E2E_CLERK_STAFF_PASSWORD;
const hasFamilyAuth = Boolean(familyEmail && familyPassword);
const hasStaffAuth = Boolean(staffEmail && staffPassword);

test.describe("unauthenticated", () => {
  test("family home redirects to sign-in", async ({ page }) => {
    await page.goto("/family");
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe("family smoke", () => {
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

  test("home loads", async ({ page }) => {
    await page.goto("/family");
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible({ timeout: 20_000 });
  });

  test("students loads", async ({ page }) => {
    await page.goto("/family/students");
    await expect(page.getByRole("heading", { name: /Students/i })).toBeVisible({ timeout: 20_000 });
  });

  test("profile loads", async ({ page }) => {
    await page.goto("/family/profile");
    await expect(page.getByRole("heading", { name: /^Profile$/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /Edit profile/i })).toBeVisible();
  });
});

test.describe("staff families smoke", () => {
  test.skip(!hasStaffAuth, "Set E2E_CLERK_STAFF_EMAIL and E2E_CLERK_STAFF_PASSWORD");

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await clerk.signIn({
      page,
      signInParams: {
        strategy: "password",
        identifier: staffEmail!,
        password: staffPassword!,
      },
    });
  });

  test("families list to detail", async ({ page }) => {
    await page.goto("/staff/families");
    await expect(page.getByRole("heading", { name: /Families/i })).toBeVisible({ timeout: 20_000 });
    const detailLink = page.locator('a[href^="/staff/families/"]').first();
    const count = await detailLink.count();
    test.skip(count === 0, "No households to open");
    await detailLink.click();
    await expect(page).toHaveURL(/\/staff\/families\/.+/);
    await expect(page.getByText(/Guardians|Students|Household/i).first()).toBeVisible();
  });
});
