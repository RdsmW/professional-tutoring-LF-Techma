ALTER TABLE tutoring_requests
  ADD COLUMN IF NOT EXISTS zoho_sync_status varchar(16),
  ADD COLUMN IF NOT EXISTS zoho_sync_last_attempt_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS zoho_sync_completed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS zoho_sync_last_error text;

UPDATE tutoring_requests
SET zoho_sync_status = 'pending'
WHERE form_id = 'academic_year_tutoring'
  AND zoho_sync_status IS NULL;

CREATE INDEX IF NOT EXISTS tutoring_requests_academic_year_zoho_sync_status_idx
  ON tutoring_requests (zoho_sync_status)
  WHERE form_id = 'academic_year_tutoring';