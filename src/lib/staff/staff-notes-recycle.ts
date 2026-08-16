/**
 * Shared soft-delete / Settings recycle-bin helpers for staff entity notes.
 * Reuse this pattern when Student and Tutor notes modules are added
 * (soft-delete columns + list/restore in Settings → Recycle bin, ~30-day purge).
 */

export const STAFF_NOTE_RECYCLE_DAYS = 30;

/** Recycle item kinds currently supported in Settings. */
export type StaffRecycledNoteKind = "guardian_note" | "household_note" | "student_note";

export type StaffRecycledNote = {
  id: string;
  kind: StaffRecycledNoteKind;
  body: string;
  authorDisplayName: string;
  createdAt: string;
  deletedAt: string;
  purgeAt: string;
  /** Parent record id (guardian / household / student / tutor). */
  entityId: string;
  entityLabel: string;
  entityHref: string;
};

export function noteRecycleCutoffDate(now = new Date()) {
  return new Date(now.getTime() - STAFF_NOTE_RECYCLE_DAYS * 24 * 60 * 60 * 1000);
}

export function notePurgeAtFromDeletedAt(deletedAt: Date) {
  return new Date(deletedAt.getTime() + STAFF_NOTE_RECYCLE_DAYS * 24 * 60 * 60 * 1000);
}
