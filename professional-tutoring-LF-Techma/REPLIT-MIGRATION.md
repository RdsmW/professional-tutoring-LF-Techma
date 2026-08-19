# Replit migration notes (plain language)

## What stays the same

- This Next.js application code
- Clerk login
- Drizzle schema / SQL migrations
- Business rules and screens

## What changes on move day

1. Host the app on **Replit** instead of your local machine / temporary host
2. Point `DATABASE_URL` to **Replit’s Postgres** instead of Supabase
3. Replay the same schema on the new database (or migrate data once)
4. Update Clerk allowed redirect URLs for the Replit domain

## What we intentionally avoid

- Supabase Auth (we use Clerk)
- Building core logic on Supabase Edge Functions
- Putting secrets in the browser (`NEXT_PUBLIC_DATABASE_URL` is forbidden)

Because of that, moving should not require rewriting the product — mostly configuration and hosting.
