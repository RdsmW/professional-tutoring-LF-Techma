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

## Important security note

Supabase currently has **Row Level Security disabled** on existing tables. This app uses the **server-only** database URL (not the browser anon key). Still, you should enable RLS (or revoke anon/authenticated table grants) before any public exposure. Ask me when you want that hardening step applied carefully.

## Replit later

See `REPLIT-MIGRATION.md`. Short version: keep Clerk + this app; change hosting and `DATABASE_URL` to Replit’s database.
