-- Append-only cancellation policy versions.
-- Named separately from existing agreement `policy_versions` (REGIS.* documents).

CREATE TABLE IF NOT EXISTS cancellation_policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  kind text NOT NULL DEFAULT 'cancellation',
  effective_from timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  rules jsonb NOT NULL,
  created_by_staff_id uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cancellation_policy_versions_kind_status_idx
  ON cancellation_policy_versions (kind, status);

ALTER TABLE change_requests
  ADD COLUMN IF NOT EXISTS cancellation_policy_version_id uuid;

INSERT INTO cancellation_policy_versions (code, kind, effective_from, status, rules, reason)
SELECT
  'PT-CAN-2026.3',
  'cancellation',
  timestamptz '2026-08-01 00:00:00-04',
  'active',
  '{
    "noticeHours": 24,
    "defaultEligibleOutcome": "banked_credit",
    "bankedExpiryDays": 90,
    "bankedExpiryMode": "days",
    "noShowTreatment": "No credit by default · Staff exception allowed",
    "tutorCancelTreatment": "Banked replacement or refund review",
    "partialCreditRule": "Prorate only with authorized exception",
    "eligibleReasons": ["Illness", "School conflict", "Emergency", "Tutor cancelled"]
  }'::jsonb,
  'Seeded from current change-request recommendation copy'
WHERE NOT EXISTS (
  SELECT 1 FROM cancellation_policy_versions WHERE code = 'PT-CAN-2026.3' AND kind = 'cancellation'
);
