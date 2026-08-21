-- Student Deal fields, mailing address, subjects join, and soft-delete notes.

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS zoho_deal_id text,
  ADD COLUMN IF NOT EXISTS zoho_deal_url text,
  ADD COLUMN IF NOT EXISTS academic_year text,
  ADD COLUMN IF NOT EXISTS preferred_schedule text,
  ADD COLUMN IF NOT EXISTS hours_rate_package text,
  ADD COLUMN IF NOT EXISTS advanced_hours_rate_package text,
  ADD COLUMN IF NOT EXISTS payment_plan text,
  ADD COLUMN IF NOT EXISTS deposit_cents integer,
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state varchar(32),
  ADD COLUMN IF NOT EXISTS postal_code varchar(32),
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'United States';

UPDATE students SET country = 'United States' WHERE country IS NULL OR country = '';

CREATE TABLE IF NOT EXISTS student_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS student_subjects_student_id_subject_id_uidx
  ON student_subjects (student_id, subject_id);

CREATE TABLE IF NOT EXISTS student_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS student_notes_student_id_idx ON student_notes (student_id);
CREATE INDEX IF NOT EXISTS student_notes_deleted_at_idx
  ON student_notes (deleted_at)
  WHERE deleted_at IS NOT NULL;
