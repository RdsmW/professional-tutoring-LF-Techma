import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const householdStatusEnum = pgEnum("household_status", [
  "active",
  "pending",
  "inactive",
  "archived",
]);

export const staffRoleEnum = pgEnum("staff_role", [
  "admin",
  "scheduler",
  "finance",
  "support",
]);

export const studentLifecycleEnum = pgEnum("student_lifecycle", [
  "prospect",
  "active",
  "paused",
  "completed",
  "archived",
]);

export const households = pgTable("households", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name").notNull(),
  status: householdStatusEnum("status").notNull().default("pending"),
  billingOwnerGuardianId: uuid("billing_owner_guardian_id"),
  primaryPhone: varchar("primary_phone", { length: 64 }),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: varchar("state", { length: 32 }),
  postalCode: varchar("postal_code", { length: 32 }),
  timezone: text("timezone").notNull().default("America/New_York"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guardians = pgTable("guardians", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id),
  clerkUserId: text("clerk_user_id"),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: varchar("phone", { length: 64 }),
  isBillingOwner: boolean("is_billing_owner").notNull().default(false),
  canManageStudents: boolean("can_manage_students").notNull().default(true),
  canRequestServices: boolean("can_request_services").notNull().default(true),
  inviteToken: text("invite_token"),
  inviteAcceptedAt: timestamp("invite_accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id),
  displayName: text("display_name").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  gender: text("gender"),
  schoolName: text("school_name"),
  graduationYear: integer("graduation_year"),
  gradeLabel: text("grade_label"),
  lifecycle: studentLifecycleEnum("lifecycle").notNull().default("prospect"),
  cellPhone: varchar("cell_phone", { length: 64 }),
  email: text("email"),
  birthdate: text("birthdate"),
  learningNeeds: text("learning_needs"),
  supportNotesRestricted: text("support_notes_restricted"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const staffProfiles = pgTable("staff_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  role: staffRoleEnum("role").notNull().default("support"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tutors = pgTable("tutors", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  phone: varchar("phone", { length: 64 }),
  active: boolean("active").notNull().default(true),
  maxSeatsPerSlot: integer("max_seats_per_slot").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 64 }).notNull(),
  name: text("name").notNull(),
  category: text("category"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courseOfferings = pgTable("course_offerings", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 64 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  termLabel: text("term_label"),
  scheduleSummary: text("schedule_summary"),
  capacity: integer("capacity").notNull().default(20),
  enrolledCount: integer("enrolled_count").notNull().default(0),
  tuitionCents: integer("tuition_cents").notNull().default(0),
  registrationFeeCents: integer("registration_fee_cents").notNull().default(0),
  materialsFeeCents: integer("materials_fee_cents").notNull().default(0),
  policyVersionId: uuid("policy_version_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookingStatusEnum = pgEnum("booking_status", [
  "draft",
  "held",
  "pending_payment",
  "pending_staff_review",
  "confirmed",
  "cancelled",
  "failed",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "pending",
  "paid",
  "partial",
  "refunded",
  "failed",
  "waived",
]);

export const availabilitySlots = pgTable("availability_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  tutorId: uuid("tutor_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTimeLocal: varchar("start_time_local", { length: 16 }).notNull(),
  endTimeLocal: varchar("end_time_local", { length: 16 }).notNull(),
  capacitySeats: integer("capacity_seats").notNull().default(1),
  heldSeats: integer("held_seats").notNull().default(0),
  bookedSeats: integer("booked_seats").notNull().default(0),
  active: boolean("active").notNull().default(true),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  tutoringRequestId: uuid("tutoring_request_id"),
  householdId: uuid("household_id").notNull(),
  studentId: uuid("student_id").notNull(),
  subjectId: uuid("subject_id"),
  tutorId: uuid("tutor_id"),
  slotId: uuid("slot_id"),
  status: bookingStatusEnum("status").notNull().default("draft"),
  seatsClaimed: integer("seats_claimed").notNull().default(1),
  priceSnapshotId: uuid("price_snapshot_id"),
  policyVersionId: uuid("policy_version_id"),
  confirmedByStaffId: uuid("confirmed_by_staff_id"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentRecords = pgTable("payment_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").notNull(),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: uuid("related_entity_id"),
  status: paymentStatusEnum("status").notNull().default("unpaid"),
  amountCents: integer("amount_cents").notNull().default(0),
  currency: varchar("currency", { length: 8 }).notNull().default("USD"),
  methodLabel: text("method_label"),
  recordedByStaffId: uuid("recorded_by_staff_id"),
  notes: text("notes"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCustomerId: text("stripe_customer_id"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
