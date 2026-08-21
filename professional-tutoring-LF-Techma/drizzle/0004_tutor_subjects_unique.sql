-- Optional: prevent duplicate tutor/subject assignments

CREATE UNIQUE INDEX IF NOT EXISTS tutor_subjects_tutor_id_subject_id_uidx
  ON tutor_subjects (tutor_id, subject_id);
