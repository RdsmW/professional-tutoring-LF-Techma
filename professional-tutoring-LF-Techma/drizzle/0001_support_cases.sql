-- Stage 2 Slice 6: support cases + messages

DO $$ BEGIN
  CREATE TYPE support_case_status AS ENUM (
    'submitted',
    'under_review',
    'waiting_on_family',
    'resolved'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE support_case_priority AS ENUM (
    'normal',
    'time_sensitive'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE support_message_author AS ENUM (
    'family',
    'staff',
    'system'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS support_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL,
  created_by_guardian_id uuid NOT NULL,
  topic text NOT NULL,
  priority support_case_priority NOT NULL DEFAULT 'normal',
  related_label text,
  student_id uuid,
  status support_case_status NOT NULL DEFAULT 'submitted',
  assignee_staff_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_case_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  body text NOT NULL,
  author_role support_message_author NOT NULL,
  author_guardian_id uuid,
  author_staff_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
