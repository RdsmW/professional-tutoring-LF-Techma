export type FormId =
  | "academic_year_tutoring"
  | "summer_tutoring"
  | "first_class"
  | "express"
  | "summer_master_class";

export type ControlType =
  | "text"
  | "textarea"
  | "radio"
  | "select"
  | "checkbox_group"
  | "readonly"
  | "restricted"
  | "acknowledgement";

export type FieldOwner =
  | "household"
  | "guardian"
  | "student"
  | "tutoringRequest"
  | "courseEnrollment"
  | "billingIntent"
  | "consent"
  | "restricted";

export type OptionListId =
  | "GENDER"
  | "US_STATES"
  | "REFERRAL_SOURCE"
  | "GRADUATION_YEARS"
  | "ACADEMIC_YEARS"
  | "GRADE_LABELS"
  | "ACADEMIC_SUBJECTS"
  | "TEST_PREP_INTERESTS"
  | "ACADEMIC_SCHEDULE_WINDOWS"
  | "SUMMER_SCHEDULE_WINDOWS"
  | "ACADEMIC_RATE_PACKAGES"
  | "ACADEMIC_ADVANCED_RATE_PACKAGES"
  | "SUMMER_PAYMENT_PLANS"
  | "ACADEMIC_PAYMENT_PLANS"
  | "FIRST_CLASS_TIME_SLOTS"
  | "FIRST_CLASS_PAYMENT_PLANS"
  | "EXPRESS_PAYMENT_PLANS"
  | "MASTER_CLASS_SESSIONS"
  | "MASTER_CLASS_PAYMENT_PLANS"
  | "ALT_PAYMENT_METHODS"
  | "YES_NO"
  | "YES_NO_PENDING"
  | "EXPRESS_TIME_SLOTS";

export type FieldDef = {
  id: string;
  label: string;
  control: ControlType;
  owner: FieldOwner;
  forms: FormId[];
  required: boolean | "pending";
  optionListId?: OptionListId;
  mapsTo?: string;
  notes?: string;
};

export type CatalogOption = {
  id: string;
  label: string;
};

export type OptionList = {
  id: OptionListId;
  options: CatalogOption[];
  /** When set, UI must not invent choices (e.g. Express time slots). */
  status?: "ok" | "pendingClientConfirmation";
};
