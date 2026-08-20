ALTER TABLE payment_records
  ADD COLUMN IF NOT EXISTS payment_setup_completed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS continuation_token_hash text,
  ADD COLUMN IF NOT EXISTS continuation_expires_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS payment_records_continuation_token_hash_idx
  ON payment_records (continuation_token_hash)
  WHERE continuation_token_hash IS NOT NULL;