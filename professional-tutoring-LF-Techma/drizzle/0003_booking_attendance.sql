-- Additive: booking attendance fields (Staff Stage 3 Session Detail)

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS attendance_status text,
  ADD COLUMN IF NOT EXISTS attendance_notes text,
  ADD COLUMN IF NOT EXISTS attendance_recorded_at timestamptz,
  ADD COLUMN IF NOT EXISTS attendance_recorded_by_staff_id uuid;
