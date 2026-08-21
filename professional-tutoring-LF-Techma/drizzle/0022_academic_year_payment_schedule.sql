ALTER TABLE payment_records
  ADD COLUMN IF NOT EXISTS stripe_setup_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS due_at timestamp with time zone;