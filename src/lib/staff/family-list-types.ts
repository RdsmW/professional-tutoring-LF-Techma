export type StaffFamilyListRow = {
  id: string;
  displayName: string;
  status: string;
  primaryPhone: string | null;
  studentCount: number;
  guardianCount: number;
  /** Billing owner display name, when set. */
  payerName: string | null;
  cardOnFile: boolean;
  autoCharge: boolean;
  /** True when household has no students, bookings, or enrollments. */
  canDelete: boolean;
  updatedAt: string;
};
