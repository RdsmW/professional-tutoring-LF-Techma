import type { CatalogOption, OptionList, OptionListId } from "./types";

function opts(labels: string[]): CatalogOption[] {
  return labels.map((label) => ({
    id: label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, ""),
    label,
  }));
}

function optsWithIds(pairs: [string, string][]): CatalogOption[] {
  return pairs.map(([id, label]) => ({ id, label }));
}

const currentYear = new Date().getFullYear();

export const GENDER: OptionList = {
  id: "GENDER",
  options: optsWithIds([
    ["M", "M"],
    ["F", "F"],
    ["Non-Binary", "Non-Binary"],
    ["Other", "Other"],
  ]),
};

export const US_STATES: OptionList = {
  id: "US_STATES",
  options: optsWithIds([
    ["AL", "Alabama"],
    ["AK", "Alaska"],
    ["AS", "American Samoa"],
    ["AZ", "Arizona"],
    ["AR", "Arkansas"],
    ["CA", "California"],
    ["CO", "Colorado"],
    ["CT", "Connecticut"],
    ["DE", "Delaware"],
    ["DC", "District of Columbia"],
    ["FL", "Florida"],
    ["GA", "Georgia"],
    ["GU", "Guam"],
    ["HI", "Hawaii"],
    ["ID", "Idaho"],
    ["IL", "Illinois"],
    ["IN", "Indiana"],
    ["IA", "Iowa"],
    ["KS", "Kansas"],
    ["KY", "Kentucky"],
    ["LA", "Louisiana"],
    ["ME", "Maine"],
    ["MD", "Maryland"],
    ["MA", "Massachusetts"],
    ["MI", "Michigan"],
    ["MN", "Minnesota"],
    ["MS", "Mississippi"],
    ["MO", "Missouri"],
    ["MT", "Montana"],
    ["NE", "Nebraska"],
    ["NV", "Nevada"],
    ["NH", "New Hampshire"],
    ["NJ", "New Jersey"],
    ["NM", "New Mexico"],
    ["NY", "New York"],
    ["NC", "North Carolina"],
    ["ND", "North Dakota"],
    ["MP", "Northern Mariana Islands"],
    ["OH", "Ohio"],
    ["OK", "Oklahoma"],
    ["OR", "Oregon"],
    ["PA", "Pennsylvania"],
    ["PR", "Puerto Rico"],
    ["RI", "Rhode Island"],
    ["SC", "South Carolina"],
    ["SD", "South Dakota"],
    ["TN", "Tennessee"],
    ["TX", "Texas"],
    ["UT", "Utah"],
    ["VI", "U.S. Virgin Islands"],
    ["VT", "Vermont"],
    ["VA", "Virginia"],
    ["WA", "Washington"],
    ["WV", "West Virginia"],
    ["WI", "Wisconsin"],
    ["WY", "Wyoming"],
    ["AA", "Armed Forces Americas"],
    ["AE", "Armed Forces Europe"],
    ["AP", "Armed Forces Pacific"],
  ]),
};

export const REFERRAL_SOURCE: OptionList = {
  id: "REFERRAL_SOURCE",
  options: opts(["Friend", "Family", "Newsletter", "Google", "Other"]),
};

export const GRADUATION_YEARS: OptionList = {
  id: "GRADUATION_YEARS",
  options: Array.from({ length: 13 }, (_, i) => {
    const year = String(currentYear + i);
    return { id: year, label: year };
  }),
};

/** US school years (YYYY–YYYY+1), centered on the current calendar year. */
export const ACADEMIC_YEARS: OptionList = {
  id: "ACADEMIC_YEARS",
  options: Array.from({ length: 6 }, (_, i) => {
    const start = currentYear - 2 + i;
    const label = `${start}-${start + 1}`;
    return { id: label, label };
  }),
};

export const GRADE_LABELS: OptionList = {
  id: "GRADE_LABELS",
  options: opts([
    "Kindergarten",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
    "College / Undergrad",
    "Graduate",
    "Other",
  ]),
};

export const ACADEMIC_SUBJECTS: OptionList = {
  id: "ACADEMIC_SUBJECTS",
  options: opts([
    "Elementary School Math",
    "Middle School Math",
    "Algebra 1",
    "Geometry",
    "Algebra 2",
    "Pre-Calculus",
    "Calculus AB",
    "Calculus BC",
    "Linear Algebra",
    "Statistics",
    "AP Statistics",
    "Elementary School Science",
    "Middle School Science",
    "Biology",
    "AP/IB Biology",
    "Anatomy",
    "Chemistry",
    "Physics",
    "AP/IB Physics",
    "Geosystems",
    "AP Environmental Systems",
    "Oceanography",
    "Astronomy",
    "Elementary School Social Studies",
    "Middle School Social Studies/civics",
    "High School History",
    "High School AP/IB History",
    "Undergrad Level History",
    "Graduate Level History",
    "AP Economics",
    "Elementary School English",
    "Middle School English",
    "High School English",
    "High School AP English",
    "Spanish",
    "French",
    "Italian",
    "Arabic",
    "Latin",
    "Other",
  ]),
};

export const TEST_PREP_INTERESTS: OptionList = {
  id: "TEST_PREP_INTERESTS",
  options: opts(["SSAT", "HSPT", "GMAT", "GRE", "PSAT", "SAT", "ACT"]),
};

export const ACADEMIC_SCHEDULE_WINDOWS: OptionList = {
  id: "ACADEMIC_SCHEDULE_WINDOWS",
  options: optsWithIds([
    ["sun_1300_1500", "Sunday 1:00-3:00pm (available beginning in November)"],
    ["sun_1500_1700", "Sunday 3:00-5:00pm"],
    ["tue_1515_1715", "Tuesday 3:15-5:15pm"],
    ["tue_1715_1915", "Tuesday 5:15-7:15pm"],
    ["wed_1515_1715", "Wednesday 3:15-5:15pm"],
    ["wed_1715_1915", "Wednesday 5:15-7:15pm"],
    ["wed_1915_2115", "Wednesday 7:15-9:15pm"],
    ["thu_1530_1730", "Thursday 3:30-5:30pm"],
  ]),
};

export const SUMMER_SCHEDULE_WINDOWS: OptionList = {
  id: "SUMMER_SCHEDULE_WINDOWS",
  options: optsWithIds([
    ["mon_1100_1300", "Monday, 11 am -1 pm"],
    ["wed_1700_1900", "Wednesday, 5-7 pm"],
  ]),
};

export const ACADEMIC_RATE_PACKAGES: OptionList = {
  id: "ACADEMIC_RATE_PACKAGES",
  options: optsWithIds([
    ["std_2h", "2 hours per week: $460/month"],
    ["std_4h", "4 hours per week: $910/month"],
    ["std_6h", "6 hours per week: $1360/month"],
    ["std_8h", "8 hours per week: $1810/month"],
    ["std_hourly", "$65.00 per hour"],
  ]),
};

export const ACADEMIC_ADVANCED_RATE_PACKAGES: OptionList = {
  id: "ACADEMIC_ADVANCED_RATE_PACKAGES",
  options: optsWithIds([
    ["adv_2h", "2 hours per week: $600/month"],
    ["adv_4h", "4 hours per week: $1200/month"],
    ["adv_6h", "6 hours per week: $1800/month"],
    ["adv_8h", "8 hours per week: $2400/month"],
    ["adv_hourly", "$85.00 per hour"],
  ]),
};

export const ACADEMIC_PAYMENT_PLANS: OptionList = {
  id: "ACADEMIC_PAYMENT_PLANS",
  options: optsWithIds([
    ["full_year", "Full Year: Sept. through June 10, Full payment due 9/1 – 10% discount"],
    ["semester", "Semester: 9/1 and/or 2/1 – 5% discount"],
    ["monthly", "Monthly: Due the first of each month"],
  ]),
};

export const SUMMER_PAYMENT_PLANS: OptionList = {
  id: "SUMMER_PAYMENT_PLANS",
  options: optsWithIds([
    ["monthly", "Monthly: Due the first of each month"],
    ["pay_in_full", "Paying in Full: Due prior to first session (10% discount)"],
  ]),
};

export const FIRST_CLASS_TIME_SLOTS: OptionList = {
  id: "FIRST_CLASS_TIME_SLOTS",
  options: optsWithIds([
    ["sun_1715_1915", "Sundays 5:15 - 7:15pm"],
    ["sun_1915_2115", "Sundays 7:15 - 9:15pm"],
  ]),
};

export const FIRST_CLASS_PAYMENT_PLANS: OptionList = {
  id: "FIRST_CLASS_PAYMENT_PLANS",
  options: optsWithIds([
    ["pay_in_full", "Paying in full ($750 at registration +$2600 due by September 1)"],
    ["monthly", "Paying monthly ($750 at registration +$325 monthly tuition September - May)"],
  ]),
};

/** Express has no verified class-time preference on the live form — do not invent options. */
export const EXPRESS_TIME_SLOTS: OptionList = {
  id: "EXPRESS_TIME_SLOTS",
  options: [],
  status: "pendingClientConfirmation",
};

export const EXPRESS_PAYMENT_PLANS: OptionList = {
  id: "EXPRESS_PAYMENT_PLANS",
  options: optsWithIds([
    ["pay_in_full", "Pay in full ($750 at registration + $1900 due by December 1)"],
    ["monthly", "Pay monthly ($750 due at registration, $350 monthly tuition December – May)"],
  ]),
};

export const MASTER_CLASS_SESSIONS: OptionList = {
  id: "MASTER_CLASS_SESSIONS",
  options: optsWithIds([
    ["mon_track", "Mondays, 9:00-10:30am track"],
    ["mon_diag_0615", "June 15 Diagnostic testing 5:00-8:30 pm"],
    ["mon_0622", "June 22"],
    ["mon_0629", "June 29"],
    ["mon_0706", "July 6"],
    ["mon_0713", "July 13 - SAT Practice Test"],
    ["mon_0720", "July 20"],
    ["mon_0727", "July 27"],
    ["mon_0803", "August 3 - SAT Practice Test"],
    ["mon_0810", "August 10"],
    ["mon_0817", "August 17"],
    ["wed_track", "Wednesdays, 7:00-8:30pm track"],
    ["wed_0617", "June 17"],
    ["wed_0624", "June 24"],
    ["wed_0701", "July 1"],
    ["wed_0708", "July 8"],
    ["wed_0715", "July 15"],
    ["wed_0722", "July 22"],
    ["wed_0729", "July 29"],
    ["wed_0805", "August 5"],
    ["wed_0812", "August 12"],
    ["wed_0819", "August 19"],
    ["wed_0826", "August 26"],
    ["wed_0902", "September 2"],
    ["wed_0909", "September 9"],
  ]),
};

export const MASTER_CLASS_PAYMENT_PLANS: OptionList = {
  id: "MASTER_CLASS_PAYMENT_PLANS",
  options: optsWithIds([
    ["pay_in_full", "Paying in full: Registration Fee + Tuition – Discount"],
    ["monthly", "Paying monthly: $450 Registration Fee, Tuition in up to 3 installments June – August"],
  ]),
};

export const ALT_PAYMENT_METHODS: OptionList = {
  id: "ALT_PAYMENT_METHODS",
  options: opts(["Cash", "Check", "Bank Transfer"]),
};

export const YES_NO: OptionList = {
  id: "YES_NO",
  options: optsWithIds([
    ["yes", "Yes"],
    ["no", "No"],
  ]),
};

export const YES_NO_PENDING: OptionList = {
  id: "YES_NO_PENDING",
  options: optsWithIds([
    ["yes", "Yes"],
    ["no", "No"],
    ["pending", "Pending"],
  ]),
};

const ALL_LISTS: Record<OptionListId, OptionList> = {
  GENDER,
  US_STATES,
  REFERRAL_SOURCE,
  GRADUATION_YEARS,
  ACADEMIC_YEARS,
  GRADE_LABELS,
  ACADEMIC_SUBJECTS,
  TEST_PREP_INTERESTS,
  ACADEMIC_SCHEDULE_WINDOWS,
  SUMMER_SCHEDULE_WINDOWS,
  ACADEMIC_RATE_PACKAGES,
  ACADEMIC_ADVANCED_RATE_PACKAGES,
  SUMMER_PAYMENT_PLANS,
  ACADEMIC_PAYMENT_PLANS,
  FIRST_CLASS_TIME_SLOTS,
  FIRST_CLASS_PAYMENT_PLANS,
  EXPRESS_TIME_SLOTS,
  EXPRESS_PAYMENT_PLANS,
  MASTER_CLASS_SESSIONS,
  MASTER_CLASS_PAYMENT_PLANS,
  ALT_PAYMENT_METHODS,
  YES_NO,
  YES_NO_PENDING,
};

export function getOptionList(id: OptionListId): OptionList {
  return ALL_LISTS[id];
}

export function isValidOptionId(listId: OptionListId, value: string): boolean {
  const list = ALL_LISTS[listId];
  if (list.status === "pendingClientConfirmation") return false;
  return list.options.some((option) => option.id === value || option.label === value);
}

export function optionLabels(listId: OptionListId): string[] {
  return ALL_LISTS[listId].options.map((option) => option.label);
}

export function optionIds(listId: OptionListId): string[] {
  return ALL_LISTS[listId].options.map((option) => option.id);
}
