# Professional Tutoring App (real product)

This is the **real application**. The clickable mockup in `../professional-tutoring-mockup` stays the visual/workflow reference and is not modified here.

## Stage 1 (what you have now)

- Same Staff + Family look as the mockup (including Family green theme)
- Exact navigation labels (no Leads, no Schools module)
- Scheduling → Week / Courses; Sessions → Sessions / Exceptions
- Clerk sign-in
- Database via portable Postgres (`DATABASE_URL`) on your existing Supabase project `professional-tutoring`
- Drizzle schema mapped to the tables already in Supabase

Full booking/enrollment wizards are **Stage 2** (see `MOCKUP-BACKLOG.md`).

## What you need to run it

1. Copy `.env.local.example` to `.env.local`
2. Paste:
   - Clerk publishable key + secret key
   - Supabase database connection string (`DATABASE_URL`)
3. In Clerk Dashboard, set a user’s **public metadata** to `{ "role": "staff" }` for staff. Everyone else is treated as family.
4. Run:

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Database migrations (apply on Supabase)

Run additive SQL in the Supabase SQL editor (or `psql`) against the `professional-tutoring` database when deploying schema changes:

- `drizzle/0001_support_cases.sql`
- `drizzle/0002_enrollment_referral.sql`
- **`drizzle/0003_booking_attendance.sql`** — required for Staff Session Detail attendance fields (`attendance_status`, `attendance_notes`, `attendance_recorded_at`, `attendance_recorded_by_staff_id` on `bookings`)
- **`drizzle/0004_identity_merge_requests.sql`** — required for Staff identity merge queue (`identity_merge_requests` table)

Until `0003` is applied, session detail attendance save/load will fail against Postgres.
Until `0004` is applied, `/staff/families/merges` and merge-queue APIs will fail against Postgres. You can apply with:

```bash
npx tsx scripts/apply-identity-merge-requests.mts
```

(loads `DATABASE_URL` from `.env.local`)

## Important security note

Supabase currently has **Row Level Security disabled** on existing tables. This app uses the **server-only** database URL (not the browser anon key). Still, you should enable RLS (or revoke anon/authenticated table grants) before any public exposure. Ask me when you want that hardening step applied carefully.

## Replit later

See `REPLIT-MIGRATION.md`. Short version: keep Clerk + this app; change hosting and `DATABASE_URL` to Replit’s database.
