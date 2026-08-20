export const APP_TIMEZONE = "America/New_York";
export const APP_NAME = "Professional Tutoring";

/** Academic-year window until a terms table exists. Burke, VA = America/New_York. */
export const CURRENT_TERM = {
  id: "academic-2026-27",
  label: "Academic 2026–27",
  startYmd: "2026-09-08",
  endYmd: "2027-06-10",
} as const;

export const STAFF_NAV = [
  { href: "/staff", label: "Dashboard", icon: "dashboard" },
  { href: "/staff/families", label: "Families", icon: "families" },
  { href: "/staff/guardians", label: "Guardians", icon: "profile" },
  { href: "/staff/students", label: "Students", icon: "student" },
  { href: "/staff/tutors", label: "Tutors", icon: "tutor" },
  { href: "/staff/sessions", label: "Sessions", icon: "calendar" },
  { href: "/staff/billing", label: "Billing", icon: "billing" },
  { href: "/staff/public-forms", label: "Public Forms", icon: "forms" },
  { href: "/staff/reports", label: "Reports", icon: "reports" },
  // Support temporarily hidden from nav; /staff/support redirects to Dashboard.
  { href: "/staff/settings", label: "Settings", icon: "settings" },
] as const;

export const FAMILY_NAV = [
  { href: "/family", label: "Home", icon: "home" },
  { href: "/family/students", label: "Students", icon: "student" },
  { href: "/family/book-tutoring", label: "Book Tutoring", icon: "plus" },
  { href: "/family/enroll-courses", label: "Enroll in Courses", icon: "course" },
  { href: "/family/calendar", label: "Calendar & Changes", icon: "calendar" },
  { href: "/family/payments", label: "Payments & Receipts", icon: "receipt" },
  // Messages / Support temporarily hidden; /family/messages redirects to Home.
  { href: "/family/profile", label: "Profile", icon: "profile" },
] as const;

/** Mockup display labels for family roll-up (UI). DB uses household_status until Stage 2 expands. */
export const FAMILY_STATUS_LABELS = [
  "Active",
  "Ready to Schedule",
  "Waiting",
  "Onboarding",
  "On hold",
  "Inactive/Closed",
] as const;
