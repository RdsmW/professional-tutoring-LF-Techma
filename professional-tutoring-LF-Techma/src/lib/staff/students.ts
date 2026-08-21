import { and, desc, eq, isNotNull, isNull, lt } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { studentNotes, students } from "@/lib/db/schema";
import {
  notePurgeAtFromDeletedAt,
  noteRecycleCutoffDate,
  type StaffRecycledNote,
} from "@/lib/staff/staff-notes-recycle";

export type StaffStudentNote = {
  id: string;
  body: string;
  authorDisplayName: string;
  createdAt: string;
  editorDisplayName: string | null;
  updatedAt: string | null;
};

function serializeNote(note: typeof studentNotes.$inferSelect): StaffStudentNote {
  return {
    id: note.id,
    body: note.body,
    authorDisplayName: note.authorDisplayName,
    createdAt: note.createdAt.toISOString(),
    editorDisplayName: note.editorDisplayName ?? null,
    updatedAt: note.updatedAt ? note.updatedAt.toISOString() : null,
  };
}

export async function purgeExpiredStudentNotes() {
  const database = requireDb();
  await database
    .delete(studentNotes)
    .where(and(isNotNull(studentNotes.deletedAt), lt(studentNotes.deletedAt, noteRecycleCutoffDate())));
}

export async function softDeleteStudentNote(input: {
  studentId: string;
  noteId: string;
  staffId: string;
}): Promise<StaffStudentNote | null> {
  const database = requireDb();
  await purgeExpiredStudentNotes();
  const now = new Date();
  const [note] = await database
    .update(studentNotes)
    .set({
      deletedAt: now,
      deletedByStaffId: input.staffId,
    })
    .where(
      and(
        eq(studentNotes.id, input.noteId),
        eq(studentNotes.studentId, input.studentId),
        isNull(studentNotes.deletedAt),
      ),
    )
    .returning();
  return note ? serializeNote(note) : null;
}

export async function restoreStudentNote(noteId: string): Promise<{ id: string; studentId: string } | null> {
  const database = requireDb();
  await purgeExpiredStudentNotes();
  const [note] = await database
    .update(studentNotes)
    .set({
      deletedAt: null,
      deletedByStaffId: null,
    })
    .where(and(eq(studentNotes.id, noteId), isNotNull(studentNotes.deletedAt)))
    .returning({ id: studentNotes.id, studentId: studentNotes.studentId });
  return note ?? null;
}

export async function listDeletedStudentNotes(): Promise<StaffRecycledNote[]> {
  const database = requireDb();
  await purgeExpiredStudentNotes();

  const rows = await database
    .select({
      note: studentNotes,
      displayName: students.displayName,
      firstName: students.firstName,
      lastName: students.lastName,
    })
    .from(studentNotes)
    .innerJoin(students, eq(studentNotes.studentId, students.id))
    .where(isNotNull(studentNotes.deletedAt))
    .orderBy(desc(studentNotes.deletedAt));

  return rows
    .filter((row): row is typeof row & { note: typeof row.note & { deletedAt: Date } } =>
      Boolean(row.note.deletedAt),
    )
    .map((row) => {
      const deletedAt = row.note.deletedAt;
      const fullName = `${row.firstName} ${row.lastName}`.trim() || row.displayName || "Student";
      const studentId = row.note.studentId;
      return {
        ...serializeNote(row.note),
        kind: "student_note" as const,
        entityId: studentId,
        entityLabel: fullName,
        entityHref: `/staff/students/${studentId}`,
        deletedAt: deletedAt.toISOString(),
        purgeAt: notePurgeAtFromDeletedAt(deletedAt).toISOString(),
      };
    });
}

export function buildStudentListLabel(input: {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  billingEmail?: string | null;
}) {
  const fullName =
    `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim() || (input.displayName ?? "").trim() || "Student";
  const email = (input.billingEmail ?? "").trim().toLowerCase();
  return email ? `${fullName} - ${email}` : fullName;
}

export { serializeNote as serializeStudentNote };
