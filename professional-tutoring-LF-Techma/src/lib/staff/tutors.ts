import { and, desc, eq, isNotNull, isNull, lt } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { tutorNotes, tutors } from "@/lib/db/schema";
import {
  notePurgeAtFromDeletedAt,
  noteRecycleCutoffDate,
  type StaffRecycledNote,
} from "@/lib/staff/staff-notes-recycle";

export type StaffTutorNote = {
  id: string;
  body: string;
  authorDisplayName: string;
  createdAt: string;
  editorDisplayName: string | null;
  updatedAt: string | null;
};

function serializeNote(note: typeof tutorNotes.$inferSelect): StaffTutorNote {
  return {
    id: note.id,
    body: note.body,
    authorDisplayName: note.authorDisplayName,
    createdAt: note.createdAt.toISOString(),
    editorDisplayName: note.editorDisplayName ?? null,
    updatedAt: note.updatedAt ? note.updatedAt.toISOString() : null,
  };
}

export async function purgeExpiredTutorNotes() {
  const database = requireDb();
  await database
    .delete(tutorNotes)
    .where(and(isNotNull(tutorNotes.deletedAt), lt(tutorNotes.deletedAt, noteRecycleCutoffDate())));
}

export async function softDeleteTutorNote(input: {
  tutorId: string;
  noteId: string;
  staffId: string;
}): Promise<StaffTutorNote | null> {
  const database = requireDb();
  await purgeExpiredTutorNotes();
  const now = new Date();
  const [note] = await database
    .update(tutorNotes)
    .set({
      deletedAt: now,
      deletedByStaffId: input.staffId,
    })
    .where(
      and(eq(tutorNotes.id, input.noteId), eq(tutorNotes.tutorId, input.tutorId), isNull(tutorNotes.deletedAt)),
    )
    .returning();
  return note ? serializeNote(note) : null;
}

export async function restoreTutorNote(noteId: string): Promise<{ id: string; tutorId: string } | null> {
  const database = requireDb();
  await purgeExpiredTutorNotes();
  const [note] = await database
    .update(tutorNotes)
    .set({
      deletedAt: null,
      deletedByStaffId: null,
    })
    .where(and(eq(tutorNotes.id, noteId), isNotNull(tutorNotes.deletedAt)))
    .returning({ id: tutorNotes.id, tutorId: tutorNotes.tutorId });
  return note ?? null;
}

export async function listDeletedTutorNotes(): Promise<StaffRecycledNote[]> {
  const database = requireDb();
  await purgeExpiredTutorNotes();

  const rows = await database
    .select({
      note: tutorNotes,
      displayName: tutors.displayName,
    })
    .from(tutorNotes)
    .innerJoin(tutors, eq(tutorNotes.tutorId, tutors.id))
    .where(isNotNull(tutorNotes.deletedAt))
    .orderBy(desc(tutorNotes.deletedAt));

  return rows
    .filter((row): row is typeof row & { note: typeof row.note & { deletedAt: Date } } =>
      Boolean(row.note.deletedAt),
    )
    .map((row) => {
      const deletedAt = row.note.deletedAt;
      const tutorId = row.note.tutorId;
      return {
        ...serializeNote(row.note),
        kind: "tutor_note" as const,
        entityId: tutorId,
        entityLabel: row.displayName || "Tutor",
        entityHref: `/staff/tutors/${tutorId}`,
        deletedAt: deletedAt.toISOString(),
        purgeAt: notePurgeAtFromDeletedAt(deletedAt).toISOString(),
      };
    });
}

export { serializeNote as serializeTutorNote };
