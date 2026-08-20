ALTER TABLE payment_records
  ADD COLUMN IF NOT EXISTS billing_schedule_id uuid,
  ADD COLUMN IF NOT EXISTS installment_sequence integer,
  ADD COLUMN IF NOT EXISTS installment_count integer,
  ADD COLUMN IF NOT EXISTS price_snapshot_id uuid,
  ADD COLUMN IF NOT EXISTS stripe_charge_id text,
  ADD COLUMN IF NOT EXISTS continuation_consumed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS collection_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_collection_attempt_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS next_collection_attempt_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS stripe_failure_code text;

CREATE UNIQUE INDEX IF NOT EXISTS payment_records_billing_schedule_installment_idx
  ON payment_records (billing_schedule_id, installment_sequence)
  WHERE billing_schedule_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payment_records_continuation_token_hash_unique_idx
  ON payment_records (continuation_token_hash)
  WHERE continuation_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS payment_records_due_collection_idx
  ON payment_records (due_at, next_collection_attempt_at)
  WHERE billing_schedule_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  stripe_object_id text,
  processed_at timestamp with time zone NOT NULL DEFAULT now()
);