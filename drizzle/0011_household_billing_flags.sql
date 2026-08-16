-- Family source-of-truth: card-on-file flag + auto-charge preference.
ALTER TABLE households
  ADD COLUMN IF NOT EXISTS card_on_file boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_charge boolean NOT NULL DEFAULT false;

-- Backfill card_on_file from existing Stripe denormalized fields.
UPDATE households
SET card_on_file = true
WHERE card_on_file = false
  AND stripe_default_payment_method_id IS NOT NULL
  AND card_last4 IS NOT NULL
  AND length(trim(card_last4)) > 0;
