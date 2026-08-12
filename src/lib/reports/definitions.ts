import type { ReportDefinition, ReportId } from "@/lib/reports/types";

export const REPORT_DEFINITIONS: Record<ReportId, ReportDefinition> = {
  active: {
    id: "active",
    name: "Active families & students",
    summary: "Households and students with current service activity",
    columns: "Family, Student, Status, Service, School",
  },
  tutors: {
    id: "tutors",
    name: "Tutor utilization & availability",
    summary: "Declared weekly hours vs confirmed open bookings",
    columns: "Tutor, Subjects, Workload, Openings, Mode",
  },
  attendance: {
    id: "attendance",
    name: "Sessions & attendance",
    summary: "Bookings as sessions with attendance outcomes",
    columns: "Date, Student, Tutor, Session status, Attendance",
  },
  courses: {
    id: "courses",
    name: "Course enrollment & capacity",
    summary: "Roster fill versus offering capacity",
    columns: "Course, Cohort, Enrolled, Capacity, Status",
  },
  waitlist: {
    id: "waitlist",
    name: "Waitlist aging",
    summary: "Unplaced tutoring requests and waitlisted enrollments",
    columns: "Student, Subject, Requested window, Age, Next action",
  },
  revenue: {
    id: "revenue",
    name: "Revenue & billing status",
    summary: "Ledger amounts; processor/accounting remain not posted",
    columns: "Family, Amount, Processor, Accounting, Exception",
  },
  school: {
    id: "school",
    name: "School rollup",
    summary: "Student school attribute grouped as entered",
    columns: "School, Students, Services, Status, Suggestions",
  },
};

export const REPORT_DEFINITION_LIST = Object.values(REPORT_DEFINITIONS);
