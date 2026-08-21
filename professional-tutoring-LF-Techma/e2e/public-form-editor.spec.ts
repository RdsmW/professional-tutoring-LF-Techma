import { expect, test } from "@playwright/test";

test.describe("staff public form editor boundaries", () => {
  test("requires a staff sign-in before exposing the editor", async ({ page }) => {
    await page.goto("/staff/public-forms/academic_year_tutoring/edit");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("does not expose the staff form API without a staff session", async ({ request }) => {
    const response = await request.get("/api/staff/public-forms/academic_year_tutoring");
    expect(response.ok()).toBeFalsy();
  });
});