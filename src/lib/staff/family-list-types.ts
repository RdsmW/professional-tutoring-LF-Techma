export type StaffFamilyListRow = {
  id: string;
  displayName: string;
  status: string;
  primaryPhone: string | null;
  studentCount: number;
  guardianCount: number;
  /** True when household has no students, bookings, or enrollments. */
  canDelete: boolean;
  updatedAt: string;
};
