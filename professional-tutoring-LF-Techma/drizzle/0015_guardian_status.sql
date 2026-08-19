-- Guardian lifecycle: active | archived (mirrors household archive pattern).

DO $$ BEGIN
  CREATE TYPE guardian_status AS ENUM ('active', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE guardians
  ADD COLUMN IF NOT EXISTS status guardian_status;

UPDATE guardians
SET status = 'active'
WHERE status IS NULL;

ALTER TABLE guardians
  ALTER COLUMN status SET DEFAULT 'active';

DO $$ BEGIN
  ALTER TABLE guardians ALTER COLUMN status SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;
