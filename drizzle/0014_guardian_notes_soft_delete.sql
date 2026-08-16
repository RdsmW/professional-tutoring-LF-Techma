-- Soft-delete for guardian staff notes (recycle ~30 days, then purge).

ALTER TABLE guardian_notes
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by_staff_id uuid REFERENCES staff_profiles(id);

CREATE INDEX IF NOT EXISTS guardian_notes_deleted_at_idx
  ON guardian_notes (deleted_at)
  WHERE deleted_at IS NOT NULL;
