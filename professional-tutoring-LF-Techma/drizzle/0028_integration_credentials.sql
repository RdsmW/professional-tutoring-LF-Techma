CREATE TABLE IF NOT EXISTS integration_credentials (
  provider text PRIMARY KEY,
  encrypted_refresh_token text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS zoho_oauth_states (
  state_hash text PRIMARY KEY,
  staff_profile_id uuid NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS zoho_oauth_states_expires_at_idx
  ON zoho_oauth_states (expires_at);