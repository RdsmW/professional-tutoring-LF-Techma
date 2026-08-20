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
      INSERT INTO guardians (household_id, email, first_name, last_name, relationship_role, invite_token)
      VALUES (${household.id}::uuid, ${email}, 'Portal', 'Guardian', 'parent_1', ${token})
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
      const redirectOrigin = "https://portal.example.test";
      const first = await sendAcademicYearPortalInvitations({ householdId: household.id, redirectOrigin, clerk });
      const second = await sendAcademicYearPortalInvitations({ householdId: household.id, redirectOrigin, clerk });

      expect(first).toMatchObject({ emailSent: true, emailAlreadySent: false, failed: false });
      expect(second).toMatchObject({ emailSent: false, emailAlreadySent: true, failed: false });
      expect(calls).toHaveLength(1);
      expect(calls[0]).toMatchObject({
        emailAddress: email,
        notify: true,
        redirectUrl: `${redirectOrigin}/sign-in?redirect_url=%2Finvite%2F${token}`,
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

  test("sends one direct-authentication invitation for each parent and never duplicates either", async () => {
    const sql = database;
    if (!sql) throw new Error("DATABASE_URL missing");

    const marker = randomUUID();
    const [household] = await sql`
      INSERT INTO households (display_name)
      VALUES (${`Two parents ${marker}`})
      RETURNING id
    `;
    const parents = await sql`
      INSERT INTO guardians (household_id, email, first_name, last_name, relationship_role, invite_token)
      VALUES
        (${household.id}::uuid, ${`parent-1-${marker}@example.com`}, 'Parent', 'One', 'parent_1', ${`token-1-${marker}`}),
        (${household.id}::uuid, ${`parent-2-${marker}@example.com`}, 'Parent', 'Two', 'parent_2', ${`token-2-${marker}`})
      RETURNING id, email, invite_token
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
      const first = await sendAcademicYearPortalInvitations({
        householdId: household.id,
        redirectOrigin: "https://portal.example.test",
        clerk,
      });
      const replay = await sendAcademicYearPortalInvitations({
        householdId: household.id,
        redirectOrigin: "https://portal.example.test",
        clerk,
      });

      expect(first).toMatchObject({ emailSent: true, emailAlreadySent: false, failed: false });
      expect(replay).toMatchObject({ emailSent: false, emailAlreadySent: true, failed: false });
      expect(calls).toHaveLength(2);
      for (const parent of parents) {
        expect(calls).toContainEqual(expect.objectContaining({
          emailAddress: parent.email,
          redirectUrl: `https://portal.example.test/sign-in?redirect_url=%2Finvite%2F${parent.invite_token}`,
          publicMetadata: {
            portalGuardianId: parent.id,
            portalHouseholdId: household.id,
          },
        }));
      }

      const linked = await sql`
        SELECT household_id, clerk_invitation_id, clerk_invitation_sent_at
        FROM guardians
        WHERE household_id = ${household.id}::uuid
        ORDER BY email
      `;
      expect(linked).toHaveLength(2);
      expect(linked.every((row) => row.household_id === household.id && row.clerk_invitation_id && row.clerk_invitation_sent_at)).toBe(true);
    } finally {
      await sql`DELETE FROM guardians WHERE household_id = ${household.id}::uuid`;
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
        household_id, email, first_name, last_name, relationship_role, invite_token,
        clerk_invitation_id, clerk_invitation_reserved_at
      )
      VALUES (
        ${household.id}::uuid, ${`interrupted-${token}@example.com`}, 'Interrupted', 'Guardian', 'parent_1', ${token},
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
      const result = await sendAcademicYearPortalInvitations({
        householdId: household.id,
        redirectOrigin: "https://portal.example.test",
        clerk,
      });
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