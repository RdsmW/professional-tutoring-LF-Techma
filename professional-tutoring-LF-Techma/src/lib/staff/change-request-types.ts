export type StaffChangeRequestDto = {
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
  studentName: string;
  householdId: string;
  householdName: string;
  requesterName: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type ChangeRequestStatusAction = "under_review" | "approved" | "declined" | "applied";
