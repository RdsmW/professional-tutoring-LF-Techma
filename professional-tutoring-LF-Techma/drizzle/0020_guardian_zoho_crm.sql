-- Guardian Zoho CRM link fields (parity with household Zoho CRM ID / URL).

ALTER TABLE guardians
  ADD COLUMN IF NOT EXISTS zoho_crm_id text,
  ADD COLUMN IF NOT EXISTS zoho_crm_url text;
