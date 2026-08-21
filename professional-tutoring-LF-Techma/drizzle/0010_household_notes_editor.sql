-- Note edit audit: editor + updated timestamp (null until first edit).

ALTER TABLE household_notes
  ADD COLUMN IF NOT EXISTS editor_staff_id uuid REFERENCES staff_profiles(id),
  ADD COLUMN IF NOT EXISTS editor_display_name text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;
