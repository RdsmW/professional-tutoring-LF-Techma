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

async function assertExclusiveLifecycleMenu(page: import("@playwright/test").Page) {
  const trigger = page.locator(".staff-row-actions-trigger").first();
  const count = await trigger.count();
  test.skip(count === 0, "No directory rows with actions");
  await trigger.click();
  const menu = page.locator(".staff-row-actions-menu").first();
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: /^Edit$/i })).toBeVisible();
  const archive = await menu.getByRole("menuitem", { name: /^Archive$/i }).count();
  const restore = await menu.getByRole("menuitem", { name: /^Restore$/i }).count();
  const del = await menu.getByRole("menuitem", { name: /^Delete$/i }).count();
  expect(archive + restore + del).toBeLessThanOrEqual(1);
  await page.keyboard.press("Escape");
}

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

  test("create menu is tight with icons", async ({ page }) => {
    await page.goto("/staff");
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible({ timeout: 20_000 });
    await page.locator(".staff-create-menu-trigger").click();
    const panel = page.locator(".staff-create-menu-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("menuitem", { name: /Student/i })).toBeVisible();
    await expect(panel.locator("svg").first()).toBeVisible();
    const box = await panel.boundingBox();
    expect(box).toBeTruthy();
    expect((box?.width ?? 999) <= 200).toBeTruthy();
  });

  test("families directory chrome", async ({ page }) => {
    await page.goto("/staff/families");
    await expect(page.getByRole("heading", { name: /Families/i })).toBeVisible({ timeout: 20_000 });

    const filters = page.locator(".staff-directory-filters");
    await expect(filters).toBeVisible();
    const panel = page.locator(".panel").filter({ has: page.locator(".staff-dir-table") });
    await expect(panel).toBeVisible();
    const filterBox = await filters.boundingBox();
    const panelBox = await panel.boundingBox();
    expect(filterBox && panelBox && filterBox.y < panelBox.y).toBeTruthy();

    await expect(page.locator(".staff-dir-table .table-head")).toContainText(/Name/);
    await expect(page.locator(".staff-dir-table .table-head")).toContainText(/Status/);
    await expect(page.getByText(/Detail →|Open →/i)).toHaveCount(0);

    const rows = page.locator(".staff-dir-table .table-row");
    const rowCount = await rows.count();
    test.skip(rowCount === 0, "No households to inspect");
    await assertExclusiveLifecycleMenu(page);
  });

  test("students tutors guardians directory chrome", async ({ page }) => {
    await page.goto("/staff/students");
    await expect(page.getByRole("heading", { name: /Students/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".staff-directory-filters")).toBeVisible();
    await expect(page.locator(".staff-dir-table .table-head")).toContainText(/Household/);

    await page.goto("/staff/tutors");
    await expect(page.getByRole("heading", { name: /Tutors/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".staff-directory-filters")).toBeVisible();
    await expect(page.locator(".staff-dir-table .table-head")).toContainText(/Email/);

    await page.goto("/staff/guardians");
    await expect(page.getByRole("heading", { name: /Guardians/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".staff-directory-filters")).toBeVisible();
    const trigger = page.locator(".staff-row-actions-trigger").first();
    const count = await trigger.count();
    test.skip(count === 0, "No guardians to inspect");
    await trigger.click();
    const menu = page.locator(".staff-row-actions-menu").first();
    await expect(menu.getByRole("menuitem", { name: /^Edit$/i })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /Open family/i })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /^Archive$/i })).toHaveCount(0);
    await expect(menu.getByRole("menuitem", { name: /^Delete$/i })).toHaveCount(0);
    await expect(menu.getByRole("menuitem", { name: /^Restore$/i })).toHaveCount(0);
  });

  test("families list to detail with exclusive toolbar and notes", async ({ page }) => {
    await page.goto("/staff/families");
    await expect(page.getByRole("heading", { name: /Families/i })).toBeVisible({ timeout: 20_000 });
    const row = page.locator(".staff-dir-table .table-row").first();
    const count = await row.count();
    test.skip(count === 0, "No households to open");
    await row.click();
    await expect(page).toHaveURL(/\/staff\/families\/.+/);
    await expect(page.getByText(/Guardians|Students|Household/i).first()).toBeVisible();

    const toolbar = page.locator("div").filter({ has: page.getByRole("button", { name: /^Edit$/i }) }).first();
    await expect(page.getByRole("button", { name: /^Edit$/i })).toBeVisible();
    const archive = await page.getByRole("button", { name: /^Archive$/i }).count();
    const restore = await page.getByRole("button", { name: /^Restore$/i }).count();
    const del = await page.getByRole("button", { name: /^Delete$/i }).count();
    expect(archive + restore + del).toBeLessThanOrEqual(1);
    void toolbar;

    const noteBody = `Smoke note ${Date.now()}`;
    const noteBox = page.getByPlaceholder(/note/i).or(page.locator("textarea")).first();
    const addNote = page.getByRole("button", { name: /Add note/i });
    if ((await noteBox.count()) > 0 && (await addNote.count()) > 0) {
      await noteBox.fill(noteBody);
      await addNote.click();
      await expect(page.getByText(noteBody)).toBeVisible({ timeout: 15_000 });
      await expect(page.locator("text=/·/").first()).toBeVisible();
    }
  });

  test("enrollment detail human fields soft-skip when empty", async ({ page }) => {
    await page.goto("/staff/families");
    await expect(page.getByRole("heading", { name: /Families/i })).toBeVisible({ timeout: 20_000 });
    const row = page.locator(".staff-dir-table .table-row").first();
    test.skip((await row.count()) === 0, "No households to open");
    await row.click();
    await expect(page).toHaveURL(/\/staff\/families\/.+/);

    const enrollmentOpen = page
      .locator("a.staff-open-control[href*='/enrollments/']")
      .or(page.locator("a[href*='/enrollments/']"))
      .first();
    if ((await enrollmentOpen.count()) === 0) {
      test.info().annotations.push({ type: "note", description: "No enrollment link; soft-skip" });
      test.skip(true, "No enrollment to open");
    }
    await enrollmentOpen.click();
    await expect(page.getByText(/Course enrollment|Schedule|Slot preference|Notes/i).first()).toBeVisible({
      timeout: 15_000,
    });
    const bodyText = await page.locator("main, .content, body").first().innerText();
    expect(bodyText.includes("{")).toBeFalsy();
  });
});
