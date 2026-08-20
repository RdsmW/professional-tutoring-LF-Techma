import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { expect, test, type APIRequestContext } from "@playwright/test";
import postgres from "postgres";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;
const database = databaseUrl ? postgres(databaseUrl, { max: 1, prepare: false }) : null;
const windowId = "tue_1715_1915";

type SafetyCase = {
  tutorId: string;
  slotId: string;
  cleanup: () => Promise<void>;
};

async function createPathASafetyCase(): Promise<SafetyCase> {
  if (!database) throw new Error("DATABASE_URL missing");

  const subjectRows = await database`
    SELECT id
    FROM subjects
    WHERE code = 'math' AND active = true
    LIMIT 1
  `;
  const subjectId = subjectRows[0]?.id as string | undefined;
  if (!subjectId) throw new Error("An active math subject is required for this targeted test.");

  const tutorId = randomUUID();
  const slotId = randomUUID();
  await database`
    INSERT INTO tutors (id, display_name, email, active, max_seats_per_slot)
    VALUES (${tutorId}::uuid, ${`Path A safety ${tutorId.slice(0, 8)}`}, ${`path-a-safety-${tutorId}@example.com`}, true, 1)
  `;
  await database`
    INSERT INTO tutor_subjects (tutor_id, subject_id)
    VALUES (${tutorId}::uuid, ${subjectId}::uuid)
  `;
  await database`
    INSERT INTO availability_slots (
      id, tutor_id, day_of_week, start_time_local, end_time_local,
      capacity_seats, held_seats, booked_seats, active, schedule_window_id, label
    )
    VALUES (
      ${slotId}::uuid, ${tutorId}::uuid, 2, '17:15', '18:15',
      1, 0, 0, true, ${windowId}, 'Path A safety test slot'
    )
  `;

  return {
    tutorId,
    slotId,
    cleanup: async () => {
      await database`DELETE FROM bookings WHERE slot_id = ${slotId}::uuid`;
      await database`
        UPDATE tutoring_requests
        SET preferred_slot_id = NULL
        WHERE preferred_slot_id = ${slotId}::uuid
      `;
      await database`DELETE FROM availability_slots WHERE id = ${slotId}::uuid`;
      await database`DELETE FROM tutor_subjects WHERE tutor_id = ${tutorId}::uuid`;
      await database`DELETE FROM tutors WHERE id = ${tutorId}::uuid`;
    },
  };
}

async function registerManualPathA(
  request: APIRequestContext,
  safetyCase: SafetyCase,
  label: string,
) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
  const phoneSuffix = suffix.slice(-4);
  const response = await request.post("/api/public/ay-tutoring-registration", {
    data: {
      student: {
        firstName: "Safety",
        lastName: label,
        schoolName: "Test High",
        gradeLabel: "grade_9",
        graduationYear: String(new Date().getFullYear() + 3),
        gender: "F",
        birthdate: "2010-04-12",
        cellPhone: `703222${phoneSuffix}`,
        addressLine1: "3 Student Ln",
        city: "Burke",
        state: "VA",
        postalCode: "22015",
      },
      parent1: {
        firstName: "Path",
        lastName: "Safety",
        email: `path-a-safety-${label}-${suffix}@example.com`,
        phone: `571222${phoneSuffix}`,
      },
      householdAddress: {
        addressLine1: "3 Main St",
        city: "Burke",
        state: "VA",
        postalCode: "22015",
      },
      billing: {
        firstName: "Path",
        lastName: "Safety",
        email: `path-a-billing-${label}-${suffix}@example.com`,
        phone: `540222${phoneSuffix}`,
        addressLine1: "3 Billing Rd",
        city: "Burke",
        state: "VA",
        postalCode: "22015",
      },
      subjectCodes: ["algebra_1"],
      primarySubjectCode: "algebra_1",
      referralSource: "friend",
      schedulingPath: "family_selected",
      windowId,
      tutorId: safetyCase.tutorId,
      slotId: safetyCase.slotId,
      paymentPlanId: "monthly",
      hoursRatePackage: "std_2h",
      autoCharge: "no",
      altPaymentMethod: "Check",
      policyAck: true,
      agreementAck: true,
      parentSignature: "Path Safety",
      studentSignature: `Safety ${label}`,
    },
  });
  const body = await response.json();
  expect(response.ok(), JSON.stringify(body)).toBeTruthy();
  return body;
}

test.describe("Path A finalization safety", () => {
  test.skip(!database, "DATABASE_URL is required for the targeted Path A safety tests");

  test.afterAll(async () => {
    await database?.end({ timeout: 1 });
  });

  test("rejects a tutor deactivated after selection", async ({ request }) => {
    const sql = database;
    if (!sql) throw new Error("DATABASE_URL missing");
    const safetyCase = await createPathASafetyCase();
    try {
      const registration = await registerManualPathA(request, safetyCase, "inactive");
      await sql`UPDATE tutors SET active = false WHERE id = ${safetyCase.tutorId}::uuid`;

      const response = await request.post("/api/public/ay-tutoring-payment/finalize", {
        data: { token: registration.payment.token },
      });
      expect(response.status()).toBe(409);
      expect((await response.json()).code).toBe("tutor_unavailable");
    } finally {
      await safetyCase.cleanup();
    }
  });

  test("reuses one booking for concurrent Path A finalization", async ({ request }) => {
    const safetyCase = await createPathASafetyCase();
    try {
      const registration = await registerManualPathA(request, safetyCase, "concurrent");
      const [first, second] = await Promise.all([
        request.post("/api/public/ay-tutoring-payment/finalize", {
          data: { token: registration.payment.token },
        }),
        request.post("/api/public/ay-tutoring-payment/finalize", {
          data: { token: registration.payment.token },
        }),
      ]);
      const firstBody = await first.json();
      const secondBody = await second.json();

      expect(first.ok(), JSON.stringify(firstBody)).toBeTruthy();
      expect(second.ok(), JSON.stringify(secondBody)).toBeTruthy();
      expect(firstBody.bookingId).toBeTruthy();
      expect(secondBody.bookingId).toBe(firstBody.bookingId);
    } finally {
      await safetyCase.cleanup();
    }
  });

  test("rejects a tutor who no longer teaches the primary subject", async ({ request }) => {
    const sql = database;
    if (!sql) throw new Error("DATABASE_URL missing");
    const safetyCase = await createPathASafetyCase();
    try {
      const registration = await registerManualPathA(request, safetyCase, "subject");
      await sql`DELETE FROM tutor_subjects WHERE tutor_id = ${safetyCase.tutorId}::uuid`;

      const response = await request.post("/api/public/ay-tutoring-payment/finalize", {
        data: { token: registration.payment.token },
      });
      expect(response.status()).toBe(409);
      expect((await response.json()).code).toBe("tutor_unavailable");
    } finally {
      await safetyCase.cleanup();
    }
  });

  test("rejects a slot moved outside the original schedule window", async ({ request }) => {
    const sql = database;
    if (!sql) throw new Error("DATABASE_URL missing");
    const safetyCase = await createPathASafetyCase();
    try {
      const registration = await registerManualPathA(request, safetyCase, "window");
      await sql`
        UPDATE availability_slots
        SET schedule_window_id = 'tue_1715_1915_changed'
        WHERE id = ${safetyCase.slotId}::uuid
      `;

      const response = await request.post("/api/public/ay-tutoring-payment/finalize", {
        data: { token: registration.payment.token },
      });
      expect(response.status()).toBe(409);
      expect((await response.json()).code).toBe("slot_unavailable");
    } finally {
      await safetyCase.cleanup();
    }
  });
});