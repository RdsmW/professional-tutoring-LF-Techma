/**
 * Remove guardian rows that overlap staff_profiles (same email or clerk_user_id).
 *
 * Product rule: staff must never be guardians. This cleans bad historical rows so they
 * disappear from the Guardians directory because the row is gone — not because of a list filter.
 *
 * Safe steps per overlap:
 * 1. Clear household billing_owner pointer / reassign remaining household guardians
 * 2. Delete guardian_notes for that guardian
 * 3. Delete the guardians row
 *
 * Usage:
 *   npx tsx scripts/cleanup-staff-as-guardians.mts          # dry-run
 *   npx tsx scripts/cleanup-staff-as-guardians.mts --apply  # mutate
 */
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const apply = process.argv.includes("--apply");

type OverlapRow = {
  guardian_id: string;
  first_name: string;
  last_name: string;
  email: string;
  clerk_user_id: string | null;
  household_id: string | null;
  match_on: string;
  staff_email: string;
  staff_full_name: string;
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");

  const sql = postgres(url, { max: 1, prepare: false });

  try {
    const overlaps = await sql<OverlapRow[]>`
      select
        g.id as guardian_id,
        g.first_name,
        g.last_name,
        g.email,
        g.clerk_user_id,
        g.household_id,
        case
          when g.clerk_user_id is not null and g.clerk_user_id = sp.clerk_user_id
            and lower(g.email) = lower(sp.email) then 'email+clerk'
          when g.clerk_user_id is not null and g.clerk_user_id = sp.clerk_user_id then 'clerk'
          else 'email'
        end as match_on,
        sp.email as staff_email,
        sp.full_name as staff_full_name
      from guardians g
      inner join staff_profiles sp
        on lower(sp.email) = lower(g.email)
        or (g.clerk_user_id is not null and sp.clerk_user_id = g.clerk_user_id)
      order by lower(g.email), g.id
    `;

    if (overlaps.length === 0) {
      console.log("No staff-as-guardian overlaps found. Nothing to clean.");
      return;
    }

    console.log(`Found ${overlaps.length} staff-as-guardian overlap(s):`);
    for (const row of overlaps) {
      console.log(
        `  - ${row.first_name} ${row.last_name} <${row.email}>` +
          ` guardian=${row.guardian_id}` +
          ` household=${row.household_id ?? "null"}` +
          ` match=${row.match_on}` +
          ` staff=${row.staff_full_name} <${row.staff_email}>`,
      );
    }

    if (!apply) {
      console.log("\nDry-run only. Re-run with --apply to delete these guardian rows.");
      return;
    }

    for (const row of overlaps) {
      await sql.begin(async (tx) => {
        if (row.household_id) {
          const householdId = row.household_id;
          const guardianId = row.guardian_id;

          await tx`
            update households
            set billing_owner_guardian_id = null, updated_at = now()
            where id = ${householdId}
              and billing_owner_guardian_id = ${guardianId}
          `;

          const remaining = await tx<{ id: string }[]>`
            select id from guardians
            where household_id = ${householdId}
              and id <> ${guardianId}
            order by created_at asc
          `;

          if (remaining.length > 0) {
            const nextOwnerId = remaining[0]!.id;
            await tx`
              update guardians
              set is_billing_owner = false, updated_at = now()
              where household_id = ${householdId}
            `;
            await tx`
              update guardians
              set is_billing_owner = true, updated_at = now()
              where id = ${nextOwnerId}
            `;
            await tx`
              update households
              set billing_owner_guardian_id = ${nextOwnerId}, updated_at = now()
              where id = ${householdId}
            `;
          }
        }

        const deletedNotes = await tx`
          delete from guardian_notes
          where guardian_id = ${row.guardian_id}
          returning id
        `;

        await tx`
          delete from guardians
          where id = ${row.guardian_id}
        `;

        console.log(
          `Deleted guardian ${row.guardian_id} (${row.email}); notes removed=${deletedNotes.length}`,
        );
      });
    }

    console.log(`\nCleanup complete. Removed ${overlaps.length} staff-as-guardian row(s).`);
  } finally {
    await sql.end({ timeout: 1 });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
