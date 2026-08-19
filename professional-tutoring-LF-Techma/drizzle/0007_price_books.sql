-- Price books (append-only) plus price_book_id on existing price_snapshots.
-- Does not recreate price_snapshots (already present as agreement/quote stubs).

CREATE TABLE IF NOT EXISTS price_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  effective_from timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  reason text,
  created_by_staff_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS price_book_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_book_id uuid NOT NULL REFERENCES price_books(id),
  program text NOT NULL,
  rate_tier text,
  package_code text,
  plan_code text,
  amount_cents integer NOT NULL DEFAULT 0,
  registration_fee_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS price_books_status_idx ON price_books (status);
CREATE INDEX IF NOT EXISTS price_book_lines_book_idx ON price_book_lines (price_book_id);

ALTER TABLE price_snapshots
  ADD COLUMN IF NOT EXISTS price_book_id uuid;

INSERT INTO price_books (code, name, effective_from, status, reason)
SELECT
  'PT-PRICE-2026.1',
  '2026–27 catalog rates',
  timestamptz '2026-08-01 00:00:00-04',
  'active',
  'Seeded from form catalog tutoring packages. Card surcharge/late fees/intake remain locked at 0.'
WHERE NOT EXISTS (
  SELECT 1 FROM price_books WHERE code = 'PT-PRICE-2026.1'
);

INSERT INTO price_book_lines (price_book_id, program, rate_tier, package_code, plan_code, amount_cents, registration_fee_cents)
SELECT book.id, seed.program, seed.rate_tier, seed.package_code, NULL, seed.amount_cents, 0
FROM price_books book
CROSS JOIN (
  VALUES
    ('academic_tutoring', 'standard', 'std_2h', 46000),
    ('academic_tutoring', 'standard', 'std_4h', 91000),
    ('academic_tutoring', 'standard', 'std_6h', 136000),
    ('academic_tutoring', 'standard', 'std_8h', 181000),
    ('academic_tutoring', 'standard', 'std_hourly', 6500),
    ('academic_tutoring', 'advanced', 'adv_2h', 60000),
    ('academic_tutoring', 'advanced', 'adv_4h', 120000),
    ('academic_tutoring', 'advanced', 'adv_6h', 180000),
    ('academic_tutoring', 'advanced', 'adv_8h', 240000),
    ('academic_tutoring', 'advanced', 'adv_hourly', 8500),
    ('summer_tutoring', 'standard', 'std_2h', 46000),
    ('summer_tutoring', 'standard', 'std_hourly', 6500),
    ('summer_tutoring', 'advanced', 'adv_2h', 60000),
    ('summer_tutoring', 'advanced', 'adv_hourly', 8500)
) AS seed(program, rate_tier, package_code, amount_cents)
WHERE book.code = 'PT-PRICE-2026.1'
  AND NOT EXISTS (
    SELECT 1 FROM price_book_lines line WHERE line.price_book_id = book.id
  );
