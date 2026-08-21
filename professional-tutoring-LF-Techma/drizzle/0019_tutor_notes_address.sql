-- Tutor mailing address + soft-delete staff notes (parity with student/guardian/household).

ALTER TABLE tutors
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state varchar(32),
  ADD COLUMN IF NOT EXISTS postal_code varchar(32),
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'United States';

UPDATE tutors SET country = 'United States' WHERE country IS NULL OR country = '';

CREATE TABLE IF NOT EXISTS tutor_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  author_staff_id uuid REFERENCES staff_profiles(id),
  author_display_name text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  editor_staff_id uuid REFERENCES staff_profiles(id),
  editor_display_name text,
  updated_at timestamptz,
  deleted_at timestamptz,
  deleted_by_staff_id uuid REFERENCES staff_profiles(id)
);

CREATE INDEX IF NOT EXISTS tutor_notes_tutor_id_idx ON tutor_notes (tutor_id);
CREATE INDEX IF NOT EXISTS tutor_notes_deleted_at_idx
  ON tutor_notes (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- One-time: copy legacy free-text tutors.notes into threaded notes when empty history.
INSERT INTO tutor_notes (tutor_id, author_display_name, body)
SELECT t.id, 'Migrated', trim(t.notes)
FROM tutors t
WHERE t.notes IS NOT NULL
  AND trim(t.notes) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM tutor_notes n WHERE n.tutor_id = t.id
  );
