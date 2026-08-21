-- One Clerk identity may represent one guardian only. A duplicate must be
-- resolved deliberately; silently merging or moving a guardian is unsafe.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM guardians
    WHERE clerk_user_id IS NOT NULL
    GROUP BY clerk_user_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add guardians clerk_user_id uniqueness: duplicate Clerk identities exist.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS guardians_clerk_user_id_unique
  ON guardians (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;