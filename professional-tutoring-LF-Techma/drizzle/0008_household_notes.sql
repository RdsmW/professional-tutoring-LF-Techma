-- Append-only staff household notes. Migrates legacy households.notes once.

CREATE TABLE IF NOT EXISTS household_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id),
  author_staff_id uuid REFERENCES staff_profiles(id),
  author_display_name text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS household_notes_household_created_idx
  ON household_notes (household_id, created_at DESC);

INSERT INTO household_notes (household_id, author_staff_id, author_display_name, body, created_at)
SELECT
  h.id,
  NULL,
  'Imported note',
  trim(h.notes),
  coalesce(h.updated_at, h.created_at, now())
FROM households h
WHERE h.notes IS NOT NULL
  AND trim(h.notes) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM household_notes n WHERE n.household_id = h.id AND n.author_display_name = 'Imported note'
  );
