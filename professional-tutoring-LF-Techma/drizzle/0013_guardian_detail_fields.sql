-- Guardian mailing address, other information, and guardian-scoped staff notes.

ALTER TABLE guardians
  ADD COLUMN IF NOT EXISTS other_information text,
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state varchar(32),
  ADD COLUMN IF NOT EXISTS postal_code varchar(32),
  ADD COLUMN IF NOT EXISTS country text;

UPDATE guardians
SET country = 'United States'
WHERE country IS NULL OR trim(country) = '';

ALTER TABLE guardians
  ALTER COLUMN country SET DEFAULT 'United States';

DO $$ BEGIN
  ALTER TABLE guardians ALTER COLUMN country SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

CREATE TABLE IF NOT EXISTS guardian_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id uuid NOT NULL REFERENCES guardians(id),
  author_staff_id uuid REFERENCES staff_profiles(id),
  author_display_name text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  editor_staff_id uuid REFERENCES staff_profiles(id),
  editor_display_name text,
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS guardian_notes_guardian_created_idx
  ON guardian_notes (guardian_id, created_at DESC);
