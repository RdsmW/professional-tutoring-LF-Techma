export const ENROLLMENT_STATUSES = [
  "draft",
  "submitted",
  "waitlisted",
  "confirmed",
  "cancelled",
] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

/** Statuses that consume a seat / count toward enrolledCount. */
export const ACTIVE_ENROLLMENT_STATUSES = ["submitted", "waitlisted", "confirmed"] as const;

export type ActiveEnrollmentStatus = (typeof ACTIVE_ENROLLMENT_STATUSES)[number];

export function isEnrollmentStatus(value: string): value is EnrollmentStatus {
  return (ENROLLMENT_STATUSES as readonly string[]).includes(value);
}

export function isActiveEnrollmentStatus(status: string): boolean {
  return (ACTIVE_ENROLLMENT_STATUSES as readonly string[]).includes(status);
}

export function enrollmentCountDelta(fromStatus: string, toStatus: string): number {
  const wasActive = isActiveEnrollmentStatus(fromStatus);
  const isActive = isActiveEnrollmentStatus(toStatus);
  if (!wasActive && isActive) return 1;
  if (wasActive && !isActive) return -1;
  return 0;
}
