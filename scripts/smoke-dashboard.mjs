import postgres from "postgres";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();
const sql = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 1,
  connect_timeout: 5,
});

const now = new Date();
const startOfWeek = new Date(now);
startOfWeek.setDate(now.getDate() - now.getDay());
startOfWeek.setHours(0, 0, 0, 0);
const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 7);

const [metrics] = await sql`
  select
    (select count(*)::int from households h
      where h.status <> 'archived'
        and (
          h.status = 'pending'
          or not exists (
            select 1 from guardians g
            where g.household_id = h.id
              and g.clerk_user_id is not null
              and trim(g.clerk_user_id) <> ''
          )
        )
    ) as onboarding_families,
    (select count(*)::int from bookings
      where created_at >= ${startOfWeek}
        and created_at <= ${endOfWeek}
        and status in ('confirmed','held','pending_payment','pending_staff_review')) as week_sessions,
    (select coalesce(sum(greatest(capacity_seats - held_seats - booked_seats, 0)), 0)::int
       from availability_slots where active = true) as tutor_openings,
    (select count(*)::int from payment_records
      where status in ('unpaid','pending','failed','partial')) as billing_exceptions
`;

const weekBars = await sql`
  select day_of_week,
         sum(capacity_seats)::int as capacity,
         sum(greatest(capacity_seats - held_seats - booked_seats, 0))::int as open
  from availability_slots
  where active = true and day_of_week between 0 and 4
  group by day_of_week
  order by day_of_week
`;

console.log(
  JSON.stringify(
    {
      ok: true,
      metrics,
      weekBars,
      expectations: {
        tutorOpeningsShouldBePositive: metrics.tutor_openings > 0,
        weekSessionsMayBeZero: metrics.week_sessions === 0,
        billingExceptionsMayBeZero: metrics.billing_exceptions === 0,
      },
    },
    null,
    2,
  ),
);

await sql.end({ timeout: 1 });
