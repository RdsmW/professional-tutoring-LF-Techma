-- Family mental model: auto name control, US country, Zoho CRM, orphanable members.
ALTER TABLE households
  ADD COLUMN IF NOT EXISTS display_name_manual boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'United States',
  ADD COLUMN IF NOT EXISTS zoho_crm_id text,
  ADD COLUMN IF NOT EXISTS zoho_crm_url text;

UPDATE households SET country = 'United States' WHERE country IS NULL OR country = '';

ALTER TABLE guardians ALTER COLUMN household_id DROP NOT NULL;
ALTER TABLE students ALTER COLUMN household_id DROP NOT NULL;
