-- Unique subject codes for catalog CRUD in Settings → Courses / Subjects.

CREATE UNIQUE INDEX IF NOT EXISTS subjects_code_uidx ON subjects (code);
