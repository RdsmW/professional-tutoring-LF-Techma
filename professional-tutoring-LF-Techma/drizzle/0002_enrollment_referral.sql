-- Additive: course enrollment referral source (Stage 2 Gravity finish)

ALTER TABLE course_enrollments
  ADD COLUMN IF NOT EXISTS referral_source text;
