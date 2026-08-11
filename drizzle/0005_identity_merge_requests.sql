-- Additive: staff identity merge queue (minimal real merge)
-- Numbered 0005 because 0004 is tutor_subjects unique index.

CREATE TABLE IF NOT EXISTS identity_merge_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_household_id uuid NOT NULL REFERENCES households(id),
  target_household_id uuid NOT NULL REFERENCES households(id),
  match_on text,
  status text NOT NULL DEFAULT 'queued',
  notes text,
  created_by_staff_id uuid,
  resolved_by_staff_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS identity_merge_requests_status_idx
  ON identity_merge_requests (status);

CREATE INDEX IF NOT EXISTS identity_merge_requests_created_at_idx
  ON identity_merge_requests (created_at DESC);
