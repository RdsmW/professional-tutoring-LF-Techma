import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { sendAcademicYearPortalInvitations } from "../src/lib/family/clerk-portal-invitations";
import {
  acceptExistingGuardianInvitation,
  hasPendingGuardianInvitation,
} from "../src/lib/family/portal-invitation-linking";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;
const database = databaseUrl ? postgres(databaseUrl, { max: 1, prepare: false }) : null;

test.describe("Academic Year Clerk portal invitations", () => {
  test.skip(!database, "DATABASE_URL is required for invitation delivery tests");

  test.afterAll(async () => {
    await database?.end({ timeout: 1 });
  });

  test("does not dispatch when either Academic Year parent is not linked or invite-ready", async () => {
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
    await sql`
      INSERT INTO guardians (household_id, email, first_name, last_name, relationship_role)
      VALUES (${household.id}::uuid, ${`not-ready-${token}@example.com`}, 'Not', 'Ready', 'parent_2')
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

      expect(first).toMatchObject({
        emailSent: false,
        failed: true,
        failedCount: 1,
        recipientConfigurationValid: false,
      });
      expect(second).toMatchObject({
        emailSent: false,
        failed: true,
        recipientConfigurationValid: false,
      });
      expect(calls).toHaveLength(0);

      const rows = await sql`
        SELECT household_id, clerk_invitation_id, clerk_invitation_sent_at
        FROM guardians
        WHERE id = ${guardian.id}::uuid
      `;
      expect(rows).toHaveLength(1);
      expect(rows[0].household_id).toBe(household.id);
      expect(rows[0].clerk_invitation_id).toBeNull();
      expect(rows[0].clerk_invitation_sent_at).toBeNull();
    } finally {
      await sql`DELETE FROM guardians WHERE household_id = ${household.id}::uuid`;
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
          redirectUrl: `https://portal.example.test/sign-in?redirect_url=https%3A%2F%2Fportal.example.test%2Finvite%2F${parent.invite_token}`,
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
    await sql`
      INSERT INTO guardians (
        household_id, email, first_name, last_name, relationship_role, clerk_user_id, invite_accepted_at
      )
      VALUES (
        ${household.id}::uuid, ${`already-linked-${token}@example.com`}, 'Linked', 'Guardian', 'parent_2',
        ${`user_linked_${token}`}, now()
      )
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
      await sql`DELETE FROM guardians WHERE household_id = ${household.id}::uuid`;
      await sql`DELETE FROM households WHERE id = ${household.id}::uuid`;
    }
  });

  test("retries only the failed parent delivery and reports an incomplete first attempt", async () => {
    const sql = database;
    if (!sql) throw new Error("DATABASE_URL missing");

    const marker = randomUUID();
    const [household] = await sql`
      INSERT INTO households (display_name)
      VALUES (${`Partial delivery ${marker}`})
      RETURNING id
    `;
    const parents = await sql`
      INSERT INTO guardians (household_id, email, first_name, last_name, relationship_role, invite_token)
      VALUES
        (${household.id}::uuid, ${`partial-parent-1-${marker}@example.com`}, 'Partial', 'One', 'parent_1', ${`partial-token-1-${marker}`}),
        (${household.id}::uuid, ${`partial-parent-2-${marker}@example.com`}, 'Partial', 'Two', 'parent_2', ${`partial-token-2-${marker}`})
      RETURNING id, email
    `;
    const calls: string[] = [];
    let failSecond = true;
    const clerk = {
      invitations: {
        createInvitation: async (input: { emailAddress: string }) => {
          calls.push(input.emailAddress);
          if (failSecond && input.emailAddress === parents[1]!.email) {
            throw new Error("temporary Clerk failure");
          }
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
      expect(first).toMatchObject({
        sentCount: 1,
        pendingCount: 1,
        eligibleCount: 2,
        deliveryComplete: false,
      });

      failSecond = false;
      await sql`
        UPDATE guardians
        SET clerk_invitation_reserved_at = now() - interval '6 minutes'
        WHERE id = ${parents[1]!.id}::uuid
      `;
      const retry = await sendAcademicYearPortalInvitations({
        householdId: household.id,
        redirectOrigin: "https://portal.example.test",
        clerk,
      });
      expect(retry).toMatchObject({
        sentCount: 1,
        alreadySentCount: 1,
        failedCount: 0,
        deliveryComplete: true,
        recipientConfigurationValid: true,
      });
      expect(calls).toEqual([parents[0]!.email, parents[1]!.email, parents[1]!.email]);
    } finally {
      await sql`DELETE FROM guardians WHERE household_id = ${household.id}::uuid`;
      await sql`DELETE FROM households WHERE id = ${household.id}::uuid`;
    }
  });

  test("does not resend after Clerk succeeds but delivery persistence fails", async () => {
    const sql = database;
    if (!sql) throw new Error("DATABASE_URL missing");

    const marker = randomUUID();
    const [household] = await sql`
      INSERT INTO households (display_name)
      VALUES (${`Persistence recovery ${marker}`})
      RETURNING id
    `;
    const parents = await sql`
      INSERT INTO guardians (household_id, email, first_name, last_name, relationship_role, invite_token)
      VALUES
        (${household.id}::uuid, ${`persist-parent-1-${marker}@example.com`}, 'Persist', 'One', 'parent_1', ${`persist-token-1-${marker}`}),
        (${household.id}::uuid, ${`persist-parent-2-${marker}@example.com`}, 'Persist', 'Two', 'parent_2', ${`persist-token-2-${marker}`})
      RETURNING id, email
    `;
    const calls: string[] = [];
    const clerk = {
      invitations: {
        createInvitation: async (input: { emailAddress: string }) => {
          calls.push(input.emailAddress);
          return { id: `inv_persist_${calls.length}` };
        },
        getInvitationList: async () => ({
          data: [{
            id: "inv_persist_1",
            publicMetadata: {
              portalGuardianId: parents[0]!.id,
              portalHouseholdId: household.id,
            },
          }],
        }),
      },
    };

    try {
      await sql.unsafe(`
        CREATE OR REPLACE FUNCTION block_test_invitation_recording()
        RETURNS trigger AS $$
        BEGIN
          IF NEW.id = '${parents[0]!.id}'::uuid
             AND NEW.clerk_invitation_id = 'inv_persist_1' THEN
            RAISE EXCEPTION 'simulated invitation persistence failure';
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        CREATE TRIGGER block_test_invitation_recording_trigger
        BEFORE UPDATE OF clerk_invitation_id ON guardians
        FOR EACH ROW EXECUTE FUNCTION block_test_invitation_recording();
      `);

      const first = await sendAcademicYearPortalInvitations({
        householdId: household.id,
        redirectOrigin: "https://portal.example.test",
        clerk,
      });
      expect(first).toMatchObject({ sentCount: 1, pendingCount: 1, deliveryComplete: false });
      expect(calls).toEqual([parents[0]!.email, parents[1]!.email]);

      const [pending] = await sql`
        SELECT clerk_invitation_id
        FROM guardians
        WHERE id = ${parents[0]!.id}::uuid
      `;
      expect(String(pending.clerk_invitation_id)).toMatch(/^sending:/);

      await sql.unsafe(`
        DROP TRIGGER block_test_invitation_recording_trigger ON guardians;
        DROP FUNCTION block_test_invitation_recording();
      `);
      await sql`
        UPDATE guardians
        SET clerk_invitation_reserved_at = now() - interval '6 minutes'
        WHERE id = ${parents[0]!.id}::uuid
      `;

      const retry = await sendAcademicYearPortalInvitations({
        householdId: household.id,
        redirectOrigin: "https://portal.example.test",
        clerk,
      });
      expect(retry).toMatchObject({ sentCount: 0, alreadySentCount: 2, deliveryComplete: true });
      expect(calls).toEqual([parents[0]!.email, parents[1]!.email]);
    } finally {
      await sql.unsafe(`
        DROP TRIGGER IF EXISTS block_test_invitation_recording_trigger ON guardians;
        DROP FUNCTION IF EXISTS block_test_invitation_recording();
      `);
      await sql`DELETE FROM guardians WHERE household_id = ${household.id}::uuid`;
      await sql`DELETE FROM households WHERE id = ${household.id}::uuid`;
    }
  });

  test("recovers an ambiguous Clerk timeout without sending another invitation", async () => {
    const sql = database;
    if (!sql) throw new Error("DATABASE_URL missing");

    const marker = randomUUID();
    const [household] = await sql`
      INSERT INTO households (display_name)
      VALUES (${`Ambiguous Clerk send ${marker}`})
      RETURNING id
    `;
    const parents = await sql`
      INSERT INTO guardians (household_id, email, first_name, last_name, relationship_role, invite_token)
      VALUES
        (${household.id}::uuid, ${`timeout-parent-1-${marker}@example.com`}, 'Timeout', 'One', 'parent_1', ${`timeout-token-1-${marker}`}),
        (${household.id}::uuid, ${`timeout-parent-2-${marker}@example.com`}, 'Timeout', 'Two', 'parent_2', ${`timeout-token-2-${marker}`})
      RETURNING id, email
    `;
    const calls: string[] = [];
    const clerk = {
      invitations: {
        createInvitation: async (input: { emailAddress: string }) => {
          calls.push(input.emailAddress);
          if (input.emailAddress === parents[0]!.email) {
            throw new Error("simulated timeout after Clerk accepted the send");
          }
          return { id: "inv_timeout_parent_2" };
        },
        getInvitationList: async () => ({
          data: [{
            id: "inv_timeout_parent_1",
            publicMetadata: {
              portalGuardianId: parents[0]!.id,
              portalHouseholdId: household.id,
            },
          }],
        }),
      },
    };

    try {
      const first = await sendAcademicYearPortalInvitations({
        householdId: household.id,
        redirectOrigin: "https://portal.example.test",
        clerk,
      });
      expect(first).toMatchObject({ sentCount: 1, pendingCount: 1, deliveryComplete: false });
      expect(calls).toEqual([parents[0]!.email, parents[1]!.email]);

      const immediateRetry = await sendAcademicYearPortalInvitations({
        householdId: household.id,
        redirectOrigin: "https://portal.example.test",
        clerk,
      });
      expect(immediateRetry).toMatchObject({ pendingCount: 1, alreadySentCount: 1, deliveryComplete: false });
      expect(calls).toEqual([parents[0]!.email, parents[1]!.email]);

      await sql`
        UPDATE guardians
        SET clerk_invitation_reserved_at = now() - interval '6 minutes'
        WHERE id = ${parents[0]!.id}::uuid
      `;
      const recovered = await sendAcademicYearPortalInvitations({
        householdId: household.id,
        redirectOrigin: "https://portal.example.test",
        clerk,
      });
      expect(recovered).toMatchObject({ sentCount: 0, alreadySentCount: 2, deliveryComplete: true });
      expect(calls).toEqual([parents[0]!.email, parents[1]!.email]);
    } finally {
      await sql`DELETE FROM guardians WHERE household_id = ${household.id}::uuid`;
      await sql`DELETE FROM households WHERE id = ${household.id}::uuid`;
    }
  });

  test("links both invited parents to their original household and replays only for the same identity", async () => {
    const sql = database;
    if (!sql) throw new Error("DATABASE_URL missing");

    const marker = randomUUID();
    const [household] = await sql`
      INSERT INTO households (display_name)
      VALUES (${`Accepted invitations ${marker}`})
      RETURNING id
    `;
    const [student] = await sql`
      INSERT INTO students (household_id, display_name, first_name, last_name)
      VALUES (${household.id}::uuid, 'Invitation Student', 'Invitation', 'Student')
      RETURNING id
    `;
    const parents = await sql`
      INSERT INTO guardians (household_id, email, first_name, last_name, relationship_role, invite_token)
      VALUES
        (${household.id}::uuid, ${`accepted-parent-1-${marker}@example.com`}, 'Accepted', 'One', 'parent_1', ${`accepted-token-1-${marker}`}),
        (${household.id}::uuid, ${`accepted-parent-2-${marker}@example.com`}, 'Accepted', 'Two', 'parent_2', ${`accepted-token-2-${marker}`})
      RETURNING id, email, invite_token
    `;

    try {
      expect(await hasPendingGuardianInvitation(parents[0]!.email.toUpperCase())).toBe(true);

      const parent1 = await acceptExistingGuardianInvitation({
        token: parents[0]!.invite_token,
        clerkUserId: `user_parent_1_${marker}`,
        email: parents[0]!.email.toUpperCase(),
        firstName: "Accepted",
        lastName: "One",
      });
      const parent2 = await acceptExistingGuardianInvitation({
        token: parents[1]!.invite_token,
        clerkUserId: `user_parent_2_${marker}`,
        email: parents[1]!.email,
        firstName: "Accepted",
        lastName: "Two",
      });
      const replay = await acceptExistingGuardianInvitation({
        token: parents[0]!.invite_token,
        clerkUserId: `user_parent_1_${marker}`,
        email: parents[0]!.email,
      });

      expect(parent1).toMatchObject({ householdId: household.id, guardianId: parents[0]!.id, replayed: false });
      expect(parent2).toMatchObject({ householdId: household.id, guardianId: parents[1]!.id, replayed: false });
      expect(replay).toMatchObject({ householdId: household.id, guardianId: parents[0]!.id, replayed: true });
      expect(await hasPendingGuardianInvitation(parents[0]!.email)).toBe(false);

      const linkedParents = await sql`
        SELECT id, household_id, clerk_user_id, invite_accepted_at, invite_token
        FROM guardians
        WHERE household_id = ${household.id}::uuid
        ORDER BY relationship_role
      `;
      expect(linkedParents).toHaveLength(2);
      expect(linkedParents.every((parent) => parent.household_id === household.id && parent.invite_accepted_at)).toBe(true);
      expect(linkedParents.map((parent) => parent.clerk_user_id).sort()).toEqual([
        `user_parent_1_${marker}`,
        `user_parent_2_${marker}`,
      ].sort());
      expect(linkedParents.map((parent) => parent.invite_token).sort()).toEqual(
        parents.map((parent) => parent.invite_token).sort(),
      );

      const householdsAfter = await sql`
        SELECT id FROM households WHERE id = ${household.id}::uuid
      `;
      const studentsAfter = await sql`
        SELECT id FROM students WHERE id = ${student.id}::uuid AND household_id = ${household.id}::uuid
      `;
      expect(householdsAfter).toHaveLength(1);
      expect(studentsAfter).toHaveLength(1);
    } finally {
      await sql`DELETE FROM students WHERE id = ${student.id}::uuid`;
      await sql`DELETE FROM guardians WHERE household_id = ${household.id}::uuid`;
      await sql`DELETE FROM households WHERE id = ${household.id}::uuid`;
    }
  });

  test("rejects mismatched emails and cross-parent Clerk identity reuse without changing guardians", async () => {
    const sql = database;
    if (!sql) throw new Error("DATABASE_URL missing");

    const marker = randomUUID();
    const [household] = await sql`
      INSERT INTO households (display_name)
      VALUES (${`Invitation conflicts ${marker}`})
      RETURNING id
    `;
    const parents = await sql`
      INSERT INTO guardians (household_id, email, first_name, last_name, relationship_role, invite_token)
      VALUES
        (${household.id}::uuid, ${`conflict-parent-1-${marker}@example.com`}, 'Conflict', 'One', 'parent_1', ${`conflict-token-1-${marker}`}),
        (${household.id}::uuid, ${`conflict-parent-2-${marker}@example.com`}, 'Conflict', 'Two', 'parent_2', ${`conflict-token-2-${marker}`})
      RETURNING id, email, invite_token
    `;

    try {
      await expect(
        acceptExistingGuardianInvitation({
          token: parents[0]!.invite_token,
          clerkUserId: `user_wrong_email_${marker}`,
          email: `wrong-${marker}@example.com`,
        }),
      ).rejects.toMatchObject({ status: 403 });

      await acceptExistingGuardianInvitation({
        token: parents[0]!.invite_token,
        clerkUserId: `user_existing_${marker}`,
        email: parents[0]!.email,
      });

      await expect(
        acceptExistingGuardianInvitation({
          token: parents[1]!.invite_token,
          clerkUserId: `user_existing_${marker}`,
          email: parents[1]!.email,
        }),
      ).rejects.toMatchObject({ status: 409 });
      await expect(
        acceptExistingGuardianInvitation({
          token: parents[0]!.invite_token,
          clerkUserId: `user_other_${marker}`,
          email: parents[0]!.email,
        }),
      ).rejects.toMatchObject({ status: 409 });

      const rows = await sql`
        SELECT email, clerk_user_id, invite_accepted_at
        FROM guardians
        WHERE household_id = ${household.id}::uuid
        ORDER BY relationship_role
      `;
      expect(rows[0]).toMatchObject({ email: parents[0]!.email, clerk_user_id: `user_existing_${marker}` });
      expect(rows[0]!.invite_accepted_at).toBeTruthy();
      expect(rows[1]).toMatchObject({ email: parents[1]!.email, clerk_user_id: null, invite_accepted_at: null });
    } finally {
      await sql`DELETE FROM guardians WHERE household_id = ${household.id}::uuid`;
      await sql`DELETE FROM households WHERE id = ${household.id}::uuid`;
    }
  });

  test("serializes concurrent attempts so one Clerk identity cannot claim both parents", async () => {
    const sql = database;
    if (!sql) throw new Error("DATABASE_URL missing");

    const marker = randomUUID();
    const [household] = await sql`
      INSERT INTO households (display_name)
      VALUES (${`Concurrent acceptance ${marker}`})
      RETURNING id
    `;
    const parents = await sql`
      INSERT INTO guardians (household_id, email, first_name, last_name, relationship_role, invite_token)
      VALUES
        (${household.id}::uuid, ${`concurrent-parent-1-${marker}@example.com`}, 'Concurrent', 'One', 'parent_1', ${`concurrent-token-1-${marker}`}),
        (${household.id}::uuid, ${`concurrent-parent-2-${marker}@example.com`}, 'Concurrent', 'Two', 'parent_2', ${`concurrent-token-2-${marker}`})
      RETURNING id, email, invite_token
    `;
    const clerkUserId = `user_concurrent_${marker}`;

    try {
      const attempts = await Promise.allSettled([
        acceptExistingGuardianInvitation({
          token: parents[0]!.invite_token,
          clerkUserId,
          email: parents[0]!.email,
        }),
        acceptExistingGuardianInvitation({
          token: parents[1]!.invite_token,
          clerkUserId,
          email: parents[1]!.email,
        }),
      ]);
      expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
      expect(attempts.filter((attempt) => attempt.status === "rejected")).toHaveLength(1);
      const rejected = attempts.find(
        (attempt): attempt is PromiseRejectedResult => attempt.status === "rejected",
      );
      expect(rejected?.reason).toMatchObject({ status: 409 });

      const rows = await sql`
        SELECT clerk_user_id, invite_accepted_at
        FROM guardians
        WHERE household_id = ${household.id}::uuid
      `;
      expect(rows.filter((row) => row.clerk_user_id === clerkUserId)).toHaveLength(1);
      expect(rows.filter((row) => row.invite_accepted_at)).toHaveLength(1);
    } finally {
      await sql`DELETE FROM guardians WHERE household_id = ${household.id}::uuid`;
      await sql`DELETE FROM households WHERE id = ${household.id}::uuid`;
    }
  });
});