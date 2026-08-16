export type GuardianLinkStatus = "linked" | "invite_pending" | "unlinked";

export type GuardianRelationshipRole = "parent_1" | "parent_2";

export type StaffGuardianNote = {
  id: string;
  body: string;
  authorDisplayName: string;
  createdAt: string;
  editorDisplayName: string | null;
  updatedAt: string | null;
};

export type StaffGuardianStudentRow = {
  id: string;
  displayName: string;
  gradeLabel: string | null;
  schoolName: string | null;
  lifecycle: string;
  canDelete: boolean;
};

export type StaffGuardianListRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  linkStatus: GuardianLinkStatus;
  relationshipRole: GuardianRelationshipRole | null;
  isBillingOwner: boolean;
  canManageStudents: boolean;
  canRequestServices: boolean;
  household: {
    id: string | null;
    displayName: string;
    status: string;
  };
  updatedAt: string;
};

export type StaffGuardianDetail = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  otherInformation: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  relationshipRole: GuardianRelationshipRole | null;
  isBillingOwner: boolean;
  canManageStudents: boolean;
  canRequestServices: boolean;
  linkStatus: GuardianLinkStatus;
  invitePending: boolean;
  invitePath: string | null;
  linked: boolean;
  createdAt: string;
  updatedAt: string;
  household: {
    id: string;
    displayName: string;
    status: string;
    billingOwnerGuardianId: string | null;
  } | null;
  householdGuardians: Array<{
    id: string;
    firstName: string;
    lastName: string;
    relationshipRole: GuardianRelationshipRole | null;
    isBillingOwner: boolean;
  }>;
  /** Present only when this guardian is responsible for payment. */
  students: StaffGuardianStudentRow[];
  notes: StaffGuardianNote[];
};

export function isGuardianRelationshipRole(value: unknown): value is GuardianRelationshipRole {
  return value === "parent_1" || value === "parent_2";
}

export function formatGuardianRelationshipRole(role: GuardianRelationshipRole | null | undefined) {
  if (role === "parent_1") return "Parent 1";
  if (role === "parent_2") return "Parent 2";
  return null;
}
