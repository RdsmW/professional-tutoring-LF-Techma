import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { changeRequests, guardians, households, students } from "@/lib/db/schema";
import type { StaffChangeRequestDto } from "@/lib/staff/change-request-types";

export type StaffExceptionDto = StaffChangeRequestDto;

const exceptionSelect = {
  id: changeRequests.id,
  status: changeRequests.status,
  changeType: changeRequests.changeType,
  reason: changeRequests.reason,
  requestedOutcome: changeRequests.requestedOutcome,
  preferredAlternatives: changeRequests.preferredAlternatives,
  policyRecommendation: changeRequests.policyRecommendation,
  relatedEntityType: changeRequests.relatedEntityType,
  relatedEntityId: changeRequests.relatedEntityId,
  staffNotes: changeRequests.staffNotes,
  studentId: changeRequests.studentId,
  householdId: changeRequests.householdId,
  createdAt: changeRequests.createdAt,
  resolvedAt: changeRequests.resolvedAt,
  studentName: students.displayName,
  householdName: households.displayName,
  requesterFirstName: guardians.firstName,
  requesterLastName: guardians.lastName,
};

type ExceptionSelectRow = {
  id: string;
  status: string;
  changeType: string;
  reason: string;
  requestedOutcome: string;
  preferredAlternatives: string | null;
  policyRecommendation: string;
  relatedEntityType: string;
  relatedEntityId: string;
  staffNotes: string | null;
  studentId: string;
  householdId: string;
  createdAt: Date;
  resolvedAt: Date | null;
  studentName: string;
  householdName: string;
  requesterFirstName: string | null;
  requesterLastName: string | null;
};

export function mapExceptionRow(row: ExceptionSelectRow): StaffExceptionDto {
  const requesterName = [row.requesterFirstName, row.requesterLastName]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ");
  return {
    id: row.id,
    status: row.status,
    changeType: row.changeType,
    reason: row.reason,
    requestedOutcome: row.requestedOutcome,
    preferredAlternatives: row.preferredAlternatives,
    policyRecommendation: row.policyRecommendation,
    relatedEntityType: row.relatedEntityType,
    relatedEntityId: row.relatedEntityId,
    staffNotes: row.staffNotes,
    studentId: row.studentId,
    studentName: row.studentName,
    householdId: row.householdId,
    householdName: row.householdName,
    requesterName: requesterName || null,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
  };
}

export function exceptionsBaseQuery() {
  const database = requireDb();
  return database
    .select(exceptionSelect)
    .from(changeRequests)
    .innerJoin(students, eq(changeRequests.studentId, students.id))
    .innerJoin(households, eq(changeRequests.householdId, households.id))
    .leftJoin(guardians, eq(changeRequests.requestedByGuardianId, guardians.id));
}

export async function loadStaffException(id: string): Promise<StaffExceptionDto | null> {
  const [row] = await exceptionsBaseQuery().where(eq(changeRequests.id, id)).limit(1);
  if (!row) return null;
  return mapExceptionRow(row);
}
