import { config } from "dotenv";
import { expect, test, type APIRequestContext } from "@playwright/test";
import postgres from "postgres";
import { academicYearPublicFormTokenForTest } from "./public-form-token";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;
const database = databaseUrl ? postgres(databaseUrl, { max: 1, prepare: false }) : null;

async function currentFormVersionToken(request: APIRequestContext) {
  void request;
  return academicYearPublicFormTokenForTest();
}

async function submitPathB1Registration(
  request: APIRequestContext,
  paymentPlanId: "full_year" | "semester" | "monthly",
) {
  const unique = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
  const phoneSuffix = unique.slice(-4);
  const formVersionToken = await currentFormVersionToken(request);
  const response = await request.post("/api/public/ay-tutoring-registration", {
    data: {
      formVersionToken,
      student: {
        firstName: "Billing",
        lastName: `Plan${paymentPlanId}${unique}`,
        schoolName: "Test High",
        gradeLabel: "grade_9",
        graduationYear: String(new Date().getFullYear() + 3),
        gender: "F",
        birthdate: "2010-04-12",
        cellPhone: `703777${phoneSuffix}`,
        email: `billing-student-${paymentPlanId}-${unique}@example.com`,
        addressLine1: "4 Student Ln",
        city: "Burke",
        state: "VA",
        postalCode: "22015",
      },
      parent1: {
        firstName: "Billing",
        lastName: "Parent",
        email: `billing-plan-${paymentPlanId}-${unique}@example.com`,
        phone: `571777${phoneSuffix}`,
      },
      householdAddress: {
        addressLine1: "4 Main St",
        city: "Burke",
        state: "VA",
        postalCode: "22015",
      },
      billing: {
        firstName: "Billing",
        lastName: "Parent",
        email: `billing-contact-${paymentPlanId}-${unique}@example.com`,
        phone: `540777${phoneSuffix}`,
        addressLine1: "4 Billing Rd",
        city: "Burke",
        state: "VA",
        postalCode: "22015",
      },
      subjectCodes: ["algebra_1"],
      primarySubjectCode: "algebra_1",
      referralSource: "friend",
      schedulingPath: "pt_chooses",
      preferredWindowIds: ["tue_1715_1915"],
      paymentPlanId,
      hoursRatePackage: "std_2h",
       autoCharge: "yes",
      policyAck: true,
      agreementAck: true,
      parentSignature: "Billing Parent",
      studentSignature: `Billing ${paymentPlanId}`,
    },
  });
  const body = await response.json();
  expect(response.ok(), JSON.stringify(body)).toBeTruthy();
  return body;
}

test.describe("Academic Year billing schedules", () => {
  test.skip(!database, "DATABASE_URL is required for Academic Year billing schedule tests");

  test.afterAll(async () => {
    await database?.end({ timeout: 1 });
  });

  for (const [planId, installmentCount] of [
    ["full_year", 1],
    ["semester", 2],
    ["monthly", 10],
  ] as const) {
    test(`creates all ${planId} installments for Path B1`, async ({ request }) => {
      const sql = database;
      if (!sql) throw new Error("DATABASE_URL missing");

      const registration = await submitPathB1Registration(request, planId);
      const rows = await sql`
        SELECT
          id,
          billing_schedule_id,
          installment_sequence,
          installment_count,
          amount_cents,
          due_at,
          price_snapshot_id,
          continuation_token_hash
        FROM payment_records
        WHERE related_entity_type = 'tutoring_request'
          AND related_entity_id = ${registration.tutoringRequestId}::uuid
        ORDER BY installment_sequence ASC
      `;

      expect(rows).toHaveLength(installmentCount);
      expect(rows.map((row) => Number(row.installment_sequence))).toEqual(
        Array.from({ length: installmentCount }, (_, index) => index + 1),
      );
      expect([...new Set(rows.map((row) => row.billing_schedule_id))]).toHaveLength(1);
      expect(rows.every((row) => Number(row.installment_count) === installmentCount)).toBeTruthy();
      expect(rows.every((row) => Number(row.amount_cents) > 0 && row.price_snapshot_id)).toBeTruthy();
      expect(rows[0]?.id).toBe(registration.payment.paymentRecordId);
      expect(rows[0]?.continuation_token_hash).toBeTruthy();
      expect(rows.slice(1).every((row) => row.continuation_token_hash === null)).toBeTruthy();

      const dueTimes = rows.map((row) => new Date(row.due_at).getTime());
      expect(dueTimes).toEqual([...dueTimes].sort((left, right) => left - right));
      const amounts = rows.map((row) => Number(row.amount_cents));
      if (planId === "full_year") expect(amounts).toEqual([407459]);
      if (planId === "semester") expect(amounts).toEqual([226366, 203729]);
      if (planId === "monthly") {
        expect(amounts.slice(0, 9)).toEqual(Array(9).fill(47656));
        expect(amounts[9]).toBe(23828);
      }
    });
  }

  test("includes the 3.6% card fee in card-collected installments", async ({ request }) => {
    const sql = database;
    if (!sql) throw new Error("DATABASE_URL missing");
    const registration = await submitPathB1Registration(request, "monthly");
    const rows = await sql`
      SELECT amount_cents, notes
      FROM payment_records
      WHERE id = ${registration.payment.paymentRecordId}::uuid
    `;
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].amount_cents)).toBe(47656);
    const notes = JSON.parse(rows[0].notes);
    expect(notes.installmentSchedule[0].baseAmountCents).toBe(46000);
    expect(notes.installmentSchedule[0].serviceFeeCents).toBe(1656);
  });
});