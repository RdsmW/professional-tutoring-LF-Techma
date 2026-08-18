import { parseMinutes } from "@/lib/reports/slot-hours";
import { formatTime12hEnglish } from "@/lib/ui/datetime";

export const SESSION_LAYOUTS = [
  { id: "week", label: "Week" },
  { id: "list", label: "List" },
] as const;

export const SESSION_TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "tutoring", label: "Tutoring" },
  { id: "classes", label: "Classes" },
] as const;

/** Row membership for week / type / issues filters. */
export const SESSION_TABS = [
  { id: "week", label: "Week" },
  { id: "tutoring", label: "Tutoring" },
  { id: "classes", label: "Classes" },
  { id: "issues", label: "Issues" },
] as const;

export type StaffSessionLayout = (typeof SESSION_LAYOUTS)[number]["id"];
export type StaffSessionTypeFilter = (typeof SESSION_TYPE_FILTERS)[number]["id"];
export type StaffSessionTab = (typeof SESSION_TABS)[number]["id"];
export type StaffSessionKind = "tutoring" | "class" | "test";

export const SESSION_TYPE_PILL: Record<StaffSessionKind, string> = {
  tutoring: "blue",
  class: "violet",
  test: "gold",
};

export const SESSION_TYPE_LABEL: Record<StaffSessionKind, string> = {
  tutoring: "Tutoring",
  class: "Class",
  test: "Test",
};

export const SESSION_CHIP_LABEL: Record<StaffSessionKind, string> = {
  tutoring: "Tutoring",
  class: "Class",
  test: "Test",
};

export const OPEN_SESSION_STATUSES = [
  "draft",
  "held",
  "pending_payment",
  "pending_staff_review",
  "confirmed",
] as const;

export const PAYMENT_ISSUE_STATUSES = ["unpaid", "pending", "failed", "partial"] as const;

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const TEST_PATTERN =
  /\b(regents|makeup|make-up|make up|practice test|midterm|final exam|placement test)\b/i;

const DAY_NAME_TO_INDEX: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

export type StaffSessionWeekDay = {
  dayIndex: number;
  weekday: (typeof DAY_SHORT)[number];
  dateLabel: string;
};

export type StaffSessionWhen = {
  day: string;
  detail: string;
  sortKey: string;
  dayIndex: number | null;
  timeLabel: string | null;
};

export type StaffSessionListRow = {
  id: string;
  kind: StaffSessionKind;
  typeLabel: string;
  whenDay: string;
  whenDetail: string;
  dayIndex: number | null;
  timeLabel: string | null;
  sortKey: string;
  what: string;
  sessionLabel: string;
  people: string;
  status: string;
  href: string;
  issue: boolean;
  issueDetail: string | null;
  tabs: StaffSessionTab[];
};

export type SessionBookingInput = {
  id: string;
  status: string;
  studentName: string;
  tutorId: string | null;
  tutorName: string | null;
  subjectName: string | null;
  subjectCode: string | null;
  subjectCategory: string | null;
  slotId: string | null;
  slotStart: string | null;
  slotEnd: string | null;
  slotDay: number | null;
  slotLabel: string | null;
  seatsClaimed: number;
};

export type SessionSlotInput = {
  id: string;
  tutorId: string;
  tutorName: string | null;
  dayOfWeek: number;
  startTimeLocal: string;
  endTimeLocal: string;
  capacitySeats: number;
  label: string | null;
  active: boolean;
};

export type SessionCourseInput = {
  id: string;
  name: string;
  scheduleSummary: string | null;
  enrolledCount: number;
  active: boolean;
  instructorName?: string | null;
};

export type SessionPaymentInput = {
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  status: string;
};

export type StaffSessionsSearchState = {
  layout: StaffSessionLayout;
  typeFilter: StaffSessionTypeFilter;
  issues: boolean;
};

export function startOfWeekNy(now = new Date()) {
  const nyParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const year = Number(nyParts.find((part) => part.type === "year")?.value);
  const month = Number(nyParts.find((part) => part.type === "month")?.value);
  const day = Number(nyParts.find((part) => part.type === "day")?.value);
  const weekday = nyParts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const weekdayIndex = DAY_SHORT.indexOf(weekday as (typeof DAY_SHORT)[number]);
  const sundayDay = day - Math.max(0, weekdayIndex);
  return new Date(Date.UTC(year, month - 1, sundayDay, 12));
}

export function weekRangeLabel(weekStart: Date) {
  const end = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
  return `${fmt.format(weekStart)} – ${fmt.format(end)}`;
}

export function weekDays(weekStart: Date): StaffSessionWeekDay[] {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
  return DAY_SHORT.map((weekday, dayIndex) => ({
    dayIndex,
    weekday,
    dateLabel: fmt.format(new Date(weekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000)),
  }));
}

export function isOpenSessionStatus(status: string) {
  return (OPEN_SESSION_STATUSES as readonly string[]).includes(status);
}

export function classifyBookingKind(input: {
  subjectName?: string | null;
  subjectCode?: string | null;
  subjectCategory?: string | null;
  slotLabel?: string | null;
}): StaffSessionKind {
  const blob = [input.subjectName, input.subjectCode, input.subjectCategory, input.slotLabel]
    .filter(Boolean)
    .join(" ");
  if (TEST_PATTERN.test(blob)) return "test";
  return "tutoring";
}

export function formatSlotWhen(
  weekStart: Date,
  dayOfWeek: number | null,
  startTime: string | null,
  fallbackLabel: string | null,
): StaffSessionWhen {
  const dayIndex =
    dayOfWeek != null && dayOfWeek >= 0 && dayOfWeek <= 6 ? dayOfWeek : null;
  const day = dayIndex != null ? DAY_SHORT[dayIndex] : "—";
  const dateLabel =
    dayIndex != null
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: "UTC",
          month: "short",
          day: "numeric",
        }).format(new Date(weekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000))
      : null;
  const timeLabel = startTime ? formatTime12hEnglish(startTime) : null;
  const detail = [dateLabel, timeLabel || fallbackLabel].filter(Boolean).join(" · ") || "Schedule pending";
  const sortKey = `${String(dayIndex ?? 9).padStart(2, "0")}-${timeLabel || startTime || "99:99"}`;
  return { day, detail, sortKey, dayIndex, timeLabel };
}

export function parseCourseSchedule(summary: string | null, weekStart: Date): StaffSessionWhen {
  const raw = (summary ?? "").trim();
  if (!raw) {
    return formatSlotWhen(weekStart, null, null, "Schedule pending");
  }
  const dayMatch = raw.match(
    /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/i,
  );
  const timeMatch = raw.match(/\b(\d{1,2}:\d{2})\s*(am|pm)?\b/i) ?? raw.match(/\b(\d{1,2})\s*(am|pm)\b/i);
  const dayIndex = dayMatch ? DAY_NAME_TO_INDEX[dayMatch[1]!.toLowerCase()] ?? null : null;
  let startTime: string | null = null;
  if (timeMatch) {
    const clock = timeMatch[1]!.includes(":") ? timeMatch[1]! : `${timeMatch[1]}:00`;
    const meridiem = timeMatch[2]?.toLowerCase();
    startTime = toTwentyFourHour(clock, meridiem);
  }
  if (dayIndex == null && !startTime) {
    return { day: "—", detail: raw, sortKey: `09-${raw}`, dayIndex: null, timeLabel: null };
  }
  return formatSlotWhen(weekStart, dayIndex, startTime, raw);
}

function toTwentyFourHour(clock: string, meridiem: string | undefined) {
  const [hourRaw, minuteRaw] = clock.split(":");
  let hour = Number.parseInt(hourRaw ?? "0", 10);
  const minute = Number.parseInt(minuteRaw ?? "0", 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return clock;
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function timesOverlap(
  aStart: string | null,
  aEnd: string | null,
  bStart: string | null,
  bEnd: string | null,
) {
  const aFrom = parseMinutes(aStart);
  const aTo = parseMinutes(aEnd) ?? (aFrom != null ? aFrom + 60 : null);
  const bFrom = parseMinutes(bStart);
  const bTo = parseMinutes(bEnd) ?? (bFrom != null ? bFrom + 60 : null);
  if (aFrom == null || aTo == null || bFrom == null || bTo == null) return false;
  return aFrom < bTo && bFrom < aTo;
}

function paymentIssueLabel(status: string) {
  if (status === "failed") return "Payment overdue — charge failed";
  if (status === "unpaid" || status === "partial") return "Payment overdue";
  if (status === "pending" || status === "pending_payment") return "Payment pending";
  return "Payment needs attention";
}

function joinIssues(parts: string[]) {
  return parts.filter(Boolean).join(" · ") || null;
}

function peopleLine(tutorName: string | null, studentOrSeat: string) {
  return `${tutorName?.trim() || "Tutor pending"} · ${studentOrSeat}`;
}

function sessionLine(kind: StaffSessionKind, what: string) {
  return `${SESSION_TYPE_LABEL[kind]} · ${what}`;
}

function classPeople(instructorName: string | null | undefined, enrolledCount: number) {
  const enrolled = `${enrolledCount} enrolled`;
  const instructor = instructorName?.trim();
  return instructor ? `${instructor} · ${enrolled}` : enrolled;
}

function toListRow(
  row: Omit<StaffSessionListRow, "sessionLabel" | "typeLabel"> & { typeLabel?: string },
): StaffSessionListRow {
  const typeLabel = row.typeLabel ?? SESSION_TYPE_LABEL[row.kind];
  return {
    ...row,
    typeLabel,
    sessionLabel: sessionLine(row.kind, row.what),
  };
}

export function parseStaffSessionsSearch(searchParams: {
  get: (key: string) => string | null;
}): StaffSessionsSearchState {
  const tab = searchParams.get("tab");
  const typeParam = searchParams.get("type");
  const layout: StaffSessionLayout = searchParams.get("view") === "list" ? "list" : "week";
  let typeFilter: StaffSessionTypeFilter = "all";
  if (typeParam === "tutoring" || typeParam === "classes") typeFilter = typeParam;
  else if (tab === "tutoring") typeFilter = "tutoring";
  else if (tab === "classes") typeFilter = "classes";
  return {
    layout,
    typeFilter,
    issues: tab === "issues",
  };
}

export function staffSessionsHref(
  state: StaffSessionsSearchState,
  searchParams?: { toString: () => string },
) {
  const params = new URLSearchParams(searchParams?.toString() ?? "");
  params.delete("exceptionId");
  params.delete("tab");
  params.delete("view");
  params.delete("type");
  if (state.layout === "list") params.set("view", "list");
  if (state.typeFilter !== "all") params.set("type", state.typeFilter);
  if (state.issues) params.set("tab", "issues");
  const query = params.toString();
  return query ? `/staff/sessions?${query}` : "/staff/sessions";
}

export function sessionRowTab(state: StaffSessionsSearchState): StaffSessionTab {
  if (state.issues) return "issues";
  if (state.typeFilter === "tutoring" || state.typeFilter === "classes") return state.typeFilter;
  return "week";
}

export function fallbackWeekDays(): StaffSessionWeekDay[] {
  return DAY_SHORT.map((weekday, dayIndex) => ({ dayIndex, weekday, dateLabel: "" }));
}

export function buildStaffSessionRows(input: {
  weekStart: Date;
  bookings: SessionBookingInput[];
  slots: SessionSlotInput[];
  courses: SessionCourseInput[];
  payments: SessionPaymentInput[];
  enrollmentCourseIds: Map<string, string>;
}): StaffSessionListRow[] {
  const { weekStart, bookings, slots, courses, payments, enrollmentCourseIds } = input;
  const listedBookings = bookings.filter(
    (row) => isOpenSessionStatus(row.status) || row.status === "failed",
  );
  const openBookings = listedBookings.filter((row) => isOpenSessionStatus(row.status));
  const slotById = new Map(slots.map((slot) => [slot.id, slot]));
  const bookingsBySlot = new Map<string, SessionBookingInput[]>();
  for (const booking of openBookings) {
    if (!booking.slotId) continue;
    const list = bookingsBySlot.get(booking.slotId) ?? [];
    list.push(booking);
    bookingsBySlot.set(booking.slotId, list);
  }

  const paymentByBooking = new Map<string, string>();
  const paymentByCourse = new Map<string, string>();
  for (const payment of payments) {
    if (!payment.relatedEntityId) continue;
    if (payment.relatedEntityType === "booking") {
      paymentByBooking.set(payment.relatedEntityId, payment.status);
    } else if (payment.relatedEntityType === "course_enrollment") {
      const courseId = enrollmentCourseIds.get(payment.relatedEntityId);
      if (courseId) paymentByCourse.set(courseId, payment.status);
    }
  }

  const conflictIds = new Set<string>();
  for (const [slotId, list] of bookingsBySlot) {
    const capacity = slotById.get(slotId)?.capacitySeats ?? 1;
    const claimed = list.reduce((sum, row) => sum + Math.max(1, row.seatsClaimed || 1), 0);
    if (claimed > capacity || list.length > capacity) {
      for (const row of list) conflictIds.add(row.id);
    }
  }

  const byTutorDay = new Map<string, SessionBookingInput[]>();
  for (const booking of openBookings) {
    if (!booking.tutorId || booking.slotDay == null) continue;
    const key = `${booking.tutorId}:${booking.slotDay}`;
    const list = byTutorDay.get(key) ?? [];
    list.push(booking);
    byTutorDay.set(key, list);
  }
  for (const list of byTutorDay.values()) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i]!;
        const b = list[j]!;
        if (a.slotId && a.slotId === b.slotId) continue;
        if (timesOverlap(a.slotStart, a.slotEnd, b.slotStart, b.slotEnd)) {
          conflictIds.add(a.id);
          conflictIds.add(b.id);
        }
      }
    }
  }

  const rows: StaffSessionListRow[] = [];

  for (const booking of listedBookings) {
    const kind = classifyBookingKind({
      subjectName: booking.subjectName,
      subjectCode: booking.subjectCode,
      subjectCategory: booking.subjectCategory,
      slotLabel: booking.slotLabel,
    });
    const when = formatSlotWhen(weekStart, booking.slotDay, booking.slotStart, booking.slotLabel);
    const issues: string[] = [];
    if (conflictIds.has(booking.id)) issues.push("Schedule conflict — tutor double-booked");
    const paymentStatus =
      paymentByBooking.get(booking.id) ??
      (booking.status === "pending_payment" || booking.status === "failed" ? booking.status : null);
    if (paymentStatus) issues.push(paymentIssueLabel(paymentStatus));

    const inWeek = isOpenSessionStatus(booking.status);
    const tabs: StaffSessionTab[] = [];
    if (inWeek) tabs.push("week", "tutoring");
    if (issues.length > 0) tabs.push("issues");
    if (tabs.length === 0) continue;

    rows.push(
      toListRow({
        id: booking.id,
        kind,
        whenDay: when.day,
        whenDetail: when.detail,
        dayIndex: when.dayIndex,
        timeLabel: when.timeLabel,
        sortKey: `${when.sortKey}-${kind}-${booking.id}`,
        what: booking.subjectName || booking.slotLabel || "Tutoring",
        people: peopleLine(booking.tutorName, booking.studentName || "Student pending"),
        status: booking.status,
        href: `/staff/sessions/${booking.id}`,
        issue: issues.length > 0,
        issueDetail: joinIssues(issues),
        tabs,
      }),
    );
  }

  for (const slot of slots) {
    if (!slot.active) continue;
    const onSlot = (bookingsBySlot.get(slot.id) ?? []).filter((row) => isOpenSessionStatus(row.status));
    const claimed = onSlot.reduce((sum, row) => sum + Math.max(1, row.seatsClaimed || 1), 0);
    const remaining = Math.max(0, slot.capacitySeats - claimed);
    if (remaining <= 0) continue;

    const when = formatSlotWhen(weekStart, slot.dayOfWeek, slot.startTimeLocal, slot.label);
    const seatLabel = claimed <= 0 ? "Available" : `${claimed} of ${slot.capacitySeats} seats`;
    const issueDetail =
      claimed <= 0
        ? "Available — none filled"
        : `Available — ${claimed} of ${slot.capacitySeats} filled`;
    const kind = classifyBookingKind({
      subjectName: onSlot[0]?.subjectName,
      slotLabel: slot.label,
    });
    const tabs: StaffSessionTab[] = claimed > 0 ? ["week", "tutoring", "issues"] : ["issues"];

    rows.push(
      toListRow({
        id: `seat:${slot.id}`,
        kind,
        whenDay: when.day,
        whenDetail: when.detail,
        dayIndex: when.dayIndex,
        timeLabel: when.timeLabel,
        sortKey: `${when.sortKey}-seat-${slot.id}`,
        what: onSlot[0]?.subjectName || slot.label || "Tutoring",
        people: peopleLine(slot.tutorName, seatLabel),
        status: claimed <= 0 ? "available" : "open",
        href: `/staff/tutors/${slot.tutorId}`,
        issue: true,
        issueDetail,
        tabs,
      }),
    );
  }

  for (const course of courses) {
    if (!course.active) continue;
    const when = parseCourseSchedule(course.scheduleSummary, weekStart);
    const paymentStatus = paymentByCourse.get(course.id);
    const issues: string[] = [];
    if (paymentStatus) issues.push(paymentIssueLabel(paymentStatus));
    const tabs: StaffSessionTab[] = ["week", "classes"];
    if (issues.length > 0) tabs.push("issues");

    rows.push(
      toListRow({
        id: `class:${course.id}`,
        kind: "class",
        whenDay: when.day,
        whenDetail: when.detail,
        dayIndex: when.dayIndex,
        timeLabel: when.timeLabel,
        sortKey: `${when.sortKey}-class-${course.id}`,
        what: course.name,
        people: classPeople(course.instructorName, course.enrolledCount),
        status: course.enrolledCount > 0 ? "confirmed" : "open",
        href: `/staff/scheduling/courses/${course.id}`,
        issue: issues.length > 0,
        issueDetail: joinIssues(issues),
        tabs,
      }),
    );
  }

  rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return rows;
}

export function isStaffSessionTab(value: string | null | undefined): value is StaffSessionTab {
  return SESSION_TABS.some((tab) => tab.id === value);
}

export function isStaffSessionLayout(value: string | null | undefined): value is StaffSessionLayout {
  return SESSION_LAYOUTS.some((item) => item.id === value);
}

export function isStaffSessionTypeFilter(
  value: string | null | undefined,
): value is StaffSessionTypeFilter {
  return SESSION_TYPE_FILTERS.some((item) => item.id === value);
}
