ALTER TABLE guardians
  ADD COLUMN IF NOT EXISTS clerk_invitation_id text,
  ADD COLUMN IF NOT EXISTS clerk_invitation_sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS clerk_invitation_reserved_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS guardians_clerk_invitation_delivery_idx
  ON guardians (household_id, clerk_invitation_sent_at);