-- Nullable instructor label on course offerings (class People column).

ALTER TABLE course_offerings
  ADD COLUMN IF NOT EXISTS instructor_name text;
