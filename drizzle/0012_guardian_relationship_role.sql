-- Parent 1 / Parent 2 slots for household guardians (max one of each per household).

DO $$ BEGIN
  CREATE TYPE guardian_relationship_role AS ENUM ('parent_1', 'parent_2');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE guardians
  ADD COLUMN IF NOT EXISTS relationship_role guardian_relationship_role;

CREATE UNIQUE INDEX IF NOT EXISTS guardians_household_parent_1_uidx
  ON guardians (household_id)
  WHERE relationship_role = 'parent_1' AND household_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS guardians_household_parent_2_uidx
  ON guardians (household_id)
  WHERE relationship_role = 'parent_2' AND household_id IS NOT NULL;
