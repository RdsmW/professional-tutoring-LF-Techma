-- Soft-delete for household/family staff notes (recycle ~30 days, then purge).
-- Same pattern as guardian_notes; reuse for student/tutor notes when those modules add notes.

ALTER TABLE household_notes
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by_staff_id uuid REFERENCES staff_profiles(id);

CREATE INDEX IF NOT EXISTS household_notes_deleted_at_idx
  ON household_notes (deleted_at)
  WHERE deleted_at IS NOT NULL;
