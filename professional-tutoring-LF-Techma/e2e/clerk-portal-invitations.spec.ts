import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { sendAcademicYearPortalInvitations } from "../src/lib/family/clerk-portal-invitations";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;
const database = databaseUrl ? postgres(databaseUrl, { max: 1, prepare: false }) : null;

test.describe("Academic Year Clerk portal invitations", () => {
  test.skip(!database, "DATABASE_URL is required for invitation delivery tests");

  test.afterAll(async () => {
    await database?.end({ timeout: 1 });
  });

  test("sends once for the existing guardian and preserves the household relationship", async () => {
    const sql = database;
    if (!sql) throw new Error("DATABASE_URL missing");

    const token = randomUUID();
    const email = `portal-invite-${token}@example.com`;
    const [household] = await sql`
      INSERT INTO households (display_name)
      VALUES (${`Invitation ${token}`})
      RETURNING id
    `;
    const [guardian] = await sql`
      INSERT INTO guardians (household_id, email, first_name, last_name, invite_token)
      VALUES (${household.id}::uuid, ${email}, 'Portal', 'Guardian', ${token})
      RETURNING id
    `;
    const calls: Array<Record<string, unknown>> = [];
    const clerk = {
      invitations: {
        createInvitation: async (input: Record<string, unknown>) => {
          calls.push(input);
          return { id: `inv_${calls.length}` };
        },
        getInvitationList: async () => ({ data: [] }),
      },
    };

    try {
      const first = await sendAcademicYearPortalInvitations({ householdId: household.id, clerk });
      const second = await sendAcademicYearPortalInvitations({ householdId: household.id, clerk });

      expect(first).toMatchObject({ emailSent: true, emailAlreadySent: false, failed: false });
      expect(second).toMatchObject({ emailSent: false, emailAlreadySent: true, failed: false });
      expect(calls).toHaveLength(1);
      expect(calls[0]).toMatchObject({
        emailAddress: email,
        notify: true,
        redirectUrl: `/invite/${token}`,
        publicMetadata: {
          portalGuardianId: guardian.id,
          portalHouseholdId: household.id,
        },
      });

      const rows = await sql`
        SELECT household_id, clerk_invitation_id, clerk_invitation_sent_at
        FROM guardians
        WHERE id = ${guardian.id}::uuid
      `;
      expect(rows).toHaveLength(1);
      expect(rows[0].household_id).toBe(household.id);
      expect(rows[0].clerk_invitation_id).toBe("inv_1");
      expect(rows[0].clerk_invitation_sent_at).toBeTruthy();
    } finally {
      await sql`DELETE FROM guardians WHERE id = ${guardian.id}::uuid`;
      await sql`DELETE FROM households WHERE id = ${household.id}::uuid`;
    }
  });

  test("recovers an interrupted send without creating another Clerk invitation", async () => {
    const sql = database;
    if (!sql) throw new Error("DATABASE_URL missing");

    const token = randomUUID();
    const [household] = await sql`
      INSERT INTO households (display_name)
      VALUES (${`Interrupted invitation ${token}`})
      RETURNING id
    `;
    const [guardian] = await sql`
      INSERT INTO guardians (
        household_id, email, first_name, last_name, invite_token,
        clerk_invitation_id, clerk_invitation_reserved_at
      )
      VALUES (
        ${household.id}::uuid, ${`interrupted-${token}@example.com`}, 'Interrupted', 'Guardian', ${token},
        'sending:interrupted', now() - interval '6 minutes'
      )
      RETURNING id
    `;
    let createCalls = 0;
    const clerk = {
      invitations: {
        createInvitation: async () => {
          createCalls += 1;
          return { id: "unexpected" };
        },
        getInvitationList: async () => ({
          data: [{
            id: "inv_recovered",
            publicMetadata: {
              portalGuardianId: guardian.id,
              portalHouseholdId: household.id,
            },
          }],
        }),
      },
    };

    try {
      const result = await sendAcademicYearPortalInvitations({ householdId: household.id, clerk });
      expect(result).toMatchObject({ emailSent: false, emailAlreadySent: true, failed: false });
      expect(createCalls).toBe(0);
      const [row] = await sql`
        SELECT clerk_invitation_id, clerk_invitation_sent_at
        FROM guardians
        WHERE id = ${guardian.id}::uuid
      `;
      expect(row.clerk_invitation_id).toBe("inv_recovered");
      expect(row.clerk_invitation_sent_at).toBeTruthy();
    } finally {
      await sql`DELETE FROM guardians WHERE id = ${guardian.id}::uuid`;
      await sql`DELETE FROM households WHERE id = ${household.id}::uuid`;
    }
  });
});