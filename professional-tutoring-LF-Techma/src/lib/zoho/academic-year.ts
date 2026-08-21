import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households, students, tutoringRequests } from "@/lib/db/schema";
import {
  getZohoAccessToken,
  verifyZohoReadOnlyAccess,
  type ZohoAccessToken,
} from "@/lib/zoho/read-only";

export type ZohoModule = "Accounts" | "Contacts" | "Deals";
export type ZohoData = Record<string, unknown>;

export type ZohoRecord = {
  id: string;
  url: string | null;
};

export type AcademicYearZohoSyncStatus = "succeeded" | "failed";

export const ZOHO_ACADEMIC_YEAR_EXCLUDED_FIELDS = [
  "Amount",
  "Expected_Revenue",
  "Total",
  "Total_Due2",
  "Total_Fees",
  "Card_Number",
  "Card_Details",
  "Auto_Charge",
  "Alternative_Payment",
] as const;

export const ZOHO_ACADEMIC_YEAR_ACCOUNT_FIELDS = [
  "Account_Name",
  "Account_Type",
  "Billing_Email_Address",
  "Billing_Street",
  "Billing_City",
  "Billing_State",
  "Billing_Code",
  "Billing_Country",
] as const;

export const ZOHO_ACADEMIC_YEAR_CONTACT_FIELDS = [
  "Account_Name",
  "First_Name",
  "Last_Name",
  "Email",
  "Phone",
  "Relationship_Status",
  "Person_Responsible_For_Payment",
  "Contact_Source",
  "Status",
] as const;

export const ZOHO_ACADEMIC_YEAR_DEAL_FIELDS = [
  "Deal_Name",
  "Stage",
  "Account_Name",
  "Contact_Name",
  "Form_Filled_For",
  "Deal_Source",
  "Billing_Email1",
  "Student_name",
  "Subject",
  "Preferred_Schedule_Day_Time",
  "Tutoring_Test_Prep",
  "Hours_Rates",
  "Advanced_Subjects_Hours_Rates",
  "Payment_Plan",
  "Signature_Parent",
  "Signature_Student",
] as const;

export function confirmedZohoFields(data: ZohoData, allowed: readonly string[]) {
  return Object.fromEntries(Object.entries(data).filter(([field]) => allowed.includes(field))) as ZohoData;
}

type GuardianRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  relationshipRole: "parent_1" | "parent_2" | null;
  isBillingOwner: boolean;
  zohoCrmId: string | null;
  zohoCrmUrl: string | null;
};

function record(value: unknown): ZohoData {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ZohoData) : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function academicYearZohoSource(value: string | null) {
  switch (value?.trim().toLowerCase()) {
    case "friend":
      return "Friend";
    case "family":
      return "Family";
    case "newsletter":
      return "Newsletter";
    case "google":
      return "Google";
    default:
      return "Other";
  }
}

function scheduleValue(payload: ZohoData, fallback: string | null, notes: string | null) {
  const windows = Array.isArray(payload.preferredWindowIds)
    ? payload.preferredWindowIds.filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    : [];
  return [windows.join(", "), fallback, notes].filter((value): value is string => Boolean(value)).join(" — ") || null;
}

function urlFromProvider(value: unknown) {
  const payload = record(value);
  const direct = text(payload.url);
  const details = record(payload.details);
  const detailUrl = text(details.url);
  return direct || detailUrl || null;
}

function idFromProvider(value: unknown) {
  const payload = record(value);
  const direct = text(payload.id);
  const details = record(payload.details);
  return direct || text(details.id);
}

class ZohoAcademicYearClient {
  constructor(private readonly token: ZohoAccessToken) {}

  private recordUrl(module: ZohoModule, id: string) {
    return `${this.token.config.apiOrigin}/crm/v8/${module}/${encodeURIComponent(id)}`;
  }

  private async request(path: string, init: RequestInit) {
    let response: Response;
    try {
      response = await fetch(`${this.token.config.apiOrigin}${path}`, {
        ...init,
        cache: "no-store",
        headers: {
          Authorization: `Zoho-oauthtoken ${this.token.value}`,
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...init.headers,
        },
      });
    } catch {
      throw new Error("Zoho CRM request failed.");
    }
    if (!response.ok) throw new Error(`Zoho CRM ${init.method ?? "GET"} request failed (${response.status}).`);
    return (await response.json().catch(() => ({}))) as unknown;
  }

  async find(module: ZohoModule, field: string, value: string, fields: string[]) {
    const params = new URLSearchParams({
      criteria: `(${field}:equals:${value})`,
      fields: fields.join(","),
      per_page: "10",
    });
    const response = await this.request(`/crm/v8/${module}/search?${params}`, { method: "GET" });
    const data = record(response).data;
    return Array.isArray(data) ? data.map(record) : [];
  }

  async create(module: ZohoModule, data: ZohoData): Promise<ZohoRecord> {
    const response = await this.request(`/crm/v8/${module}`, {
      method: "POST",
      body: JSON.stringify({ data: [data] }),
    });
    const responseData = record(response).data;
    const result = Array.isArray(responseData) ? responseData[0] : null;
    const id = idFromProvider(result);
    if (!id) throw new Error(`Zoho CRM ${module} create did not return an ID.`);
    return { id, url: urlFromProvider(result) ?? this.recordUrl(module, id) };
  }

  async update(module: ZohoModule, id: string, data: ZohoData): Promise<ZohoRecord> {
    const response = await this.request(`/crm/v8/${module}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ data: [data] }),
    });
    const responseData = record(response).data;
    const result = Array.isArray(responseData) ? responseData[0] : null;
    return { id, url: urlFromProvider(result) ?? this.recordUrl(module, id) };
  }
}

export type ZohoFindOrCreateClient = {
  find(module: ZohoModule, field: string, value: string, fields: string[]): Promise<ZohoData[]>;
  create(module: ZohoModule, data: ZohoData): Promise<ZohoRecord>;
  update(module: ZohoModule, id: string, data: ZohoData): Promise<ZohoRecord>;
};

export async function findOrCreateZohoRecord(
  client: ZohoFindOrCreateClient,
  module: ZohoModule,
  storedId: string | null,
  searchField: string,
  searchValue: string,
  searchFields: string[],
  data: ZohoData,
  matches: (value: ZohoData) => boolean = () => true,
) {
  if (storedId) return client.update(module, storedId, data);

  const existing = (await client.find(module, searchField, searchValue, searchFields)).find(matches);
  if (existing) {
    const id = text(existing.id);
    if (!id) throw new Error(`Zoho CRM ${module} search returned an invalid record.`);
    return client.update(module, id, data);
  }
  return client.create(module, data);
}

/**
 * Synchronizes one completed Academic Year registration. This intentionally
 * sends only metadata-confirmed non-financial fields. Zoho IDs are persisted
 * immediately after each successful record operation so a retry updates or
 * reuses the same records rather than creating a second family.
 */
export async function syncAcademicYearRegistrationToZoho(tutoringRequestId: string) {
  const database = requireDb();
  const [row] = await database
    .select({
      request: tutoringRequests,
      student: students,
      household: households,
    })
    .from(tutoringRequests)
    .innerJoin(students, eq(tutoringRequests.studentId, students.id))
    .innerJoin(households, eq(tutoringRequests.householdId, households.id))
    .where(and(eq(tutoringRequests.id, tutoringRequestId), eq(tutoringRequests.formId, "academic_year_tutoring")))
    .limit(1);
  if (!row) throw new Error("Academic Year registration was not found.");

  const markSync = async (
    status: "in_progress" | "succeeded" | "failed",
    extra: {
      completedAt?: Date | null;
      lastError?: string | null;
    } = {},
  ) =>
    database
      .update(tutoringRequests)
      .set({
        zohoSyncStatus: status,
        zohoSyncLastAttemptAt: new Date(),
        ...(extra.completedAt !== undefined ? { zohoSyncCompletedAt: extra.completedAt } : {}),
        ...(extra.lastError !== undefined ? { zohoSyncLastError: extra.lastError } : {}),
        updatedAt: new Date(),
      })
      .where(eq(tutoringRequests.id, tutoringRequestId));

  await markSync("in_progress", { lastError: null });
  try {
    const readVerification = await verifyZohoReadOnlyAccess();
    if (
      !readVerification.configured ||
      !readVerification.authorized ||
      readVerification.checks.length !== 4 ||
      readVerification.checks.some((check) => !check.ok)
    ) {
      throw new Error("Zoho read verification must pass before CRM writes.");
    }

    const guardianRows = (await database
    .select({
      id: guardians.id,
      firstName: guardians.firstName,
      lastName: guardians.lastName,
      email: guardians.email,
      phone: guardians.phone,
      relationshipRole: guardians.relationshipRole,
      isBillingOwner: guardians.isBillingOwner,
      zohoCrmId: guardians.zohoCrmId,
      zohoCrmUrl: guardians.zohoCrmUrl,
    })
    .from(guardians)
    .where(eq(guardians.householdId, row.household.id))) as GuardianRow[];
    const parent1 = guardianRows.find((guardian) => guardian.relationshipRole === "parent_1");
    const parent2 = guardianRows.find((guardian) => guardian.relationshipRole === "parent_2");
    if (!parent1 || !parent2) throw new Error("Academic Year registration requires both parent contacts.");

    const token = await getZohoAccessToken();
    if (!token) throw new Error("Zoho CRM authorization is unavailable.");
    const client = new ZohoAcademicYearClient(token);
    const payload = record(row.request.payload);
    const billing = record(payload.billingContact);
    const billingEmail = text(billing.email);
    if (!billingEmail) throw new Error("Academic Year registration does not contain a billing email.");

    const accountName = `${row.student.lastName} - ${billingEmail}`;
    const account = await findOrCreateZohoRecord(
    client,
    "Accounts",
    row.household.zohoCrmId,
    "Account_Name",
    accountName,
    ["id", "Account_Name"],
    confirmedZohoFields({
      Account_Name: accountName,
      // Zoho's verified API value for the displayed "Family" picklist value.
      Account_Type: "Customer",
      Billing_Email_Address: billingEmail,
      Billing_Street: text(billing.addressLine1) || null,
      Billing_City: text(billing.city) || null,
      Billing_State: text(billing.state) || null,
      Billing_Code: text(billing.postalCode) || null,
      Billing_Country: "United States",
    }, ZOHO_ACADEMIC_YEAR_ACCOUNT_FIELDS),
    );
    await database
    .update(households)
    .set({ zohoCrmId: account.id, zohoCrmUrl: account.url ?? row.household.zohoCrmUrl, updatedAt: new Date() })
      .where(eq(households.id, row.household.id));

    const contactData = (guardian: GuardianRow, relationship: "Parent 1" | "Parent 2") => ({
    Account_Name: { id: account.id },
    First_Name: guardian.firstName,
    Last_Name: guardian.lastName,
    Email: guardian.email,
    Phone: guardian.phone,
    Relationship_Status: relationship,
    Person_Responsible_For_Payment: guardian.isBillingOwner,
    Contact_Source: academicYearZohoSource(row.request.referralSource),
    Status: "Student",
    });
    const matchesAccount = (value: ZohoData) => text(record(value.Account_Name).id) === account.id;

    const parent1Record = await findOrCreateZohoRecord(
    client,
    "Contacts",
    parent1.zohoCrmId,
    "Email",
    parent1.email,
    ["id", "Email", "Account_Name"],
    confirmedZohoFields(contactData(parent1, "Parent 1"), ZOHO_ACADEMIC_YEAR_CONTACT_FIELDS),
    matchesAccount,
    );
    await database
    .update(guardians)
    .set({ zohoCrmId: parent1Record.id, zohoCrmUrl: parent1Record.url ?? parent1.zohoCrmUrl, updatedAt: new Date() })
      .where(eq(guardians.id, parent1.id));

    const parent2Record = await findOrCreateZohoRecord(
    client,
    "Contacts",
    parent2.zohoCrmId,
    "Email",
    parent2.email,
    ["id", "Email", "Account_Name"],
    confirmedZohoFields(contactData(parent2, "Parent 2"), ZOHO_ACADEMIC_YEAR_CONTACT_FIELDS),
    matchesAccount,
    );
    await database
    .update(guardians)
    .set({ zohoCrmId: parent2Record.id, zohoCrmUrl: parent2Record.url ?? parent2.zohoCrmUrl, updatedAt: new Date() })
      .where(eq(guardians.id, parent2.id));

    const billingParent = parent1.isBillingOwner ? parent1Record : parent2.isBillingOwner ? parent2Record : parent1Record;
    const signatures = record(payload.signatures);
    const dealName = `${row.student.displayName} - ${billingEmail}`;
    const deal = await findOrCreateZohoRecord(
    client,
    "Deals",
    row.student.zohoDealId,
    "Deal_Name",
    dealName,
    ["id", "Deal_Name", "Account_Name"],
    confirmedZohoFields({
      Deal_Name: dealName,
      // Zoho's verified API value for the displayed "New Registration" stage.
      Stage: "Qualification",
      Account_Name: { id: account.id },
      Contact_Name: { id: billingParent.id },
      Form_Filled_For: "Tutoring: Academic Year",
      Deal_Source: academicYearZohoSource(row.request.referralSource),
      Billing_Email1: billingEmail,
      Student_name: row.student.displayName,
      Subject: row.student.learningNeeds,
      Preferred_Schedule_Day_Time: scheduleValue(payload, row.request.scheduleWindowId, row.request.scheduleNotes),
      Tutoring_Test_Prep: Array.isArray(payload.testPrepInterests)
        ? payload.testPrepInterests.filter((value): value is string => typeof value === "string").join(", ") || null
        : null,
      Hours_Rates: row.student.hoursRatePackage,
      Advanced_Subjects_Hours_Rates: row.student.advancedHoursRatePackage,
      Payment_Plan: row.student.paymentPlan,
      Signature_Parent: text(signatures.parentTypedName) || null,
      Signature_Student: text(signatures.studentTypedName) || null,
    }, ZOHO_ACADEMIC_YEAR_DEAL_FIELDS),
    (value) => text(record(value.Account_Name).id) === account.id,
    );
    await database
    .update(students)
    .set({ zohoDealId: deal.id, zohoDealUrl: deal.url ?? row.student.zohoDealUrl, updatedAt: new Date() })
      .where(eq(students.id, row.student.id));

    await markSync("succeeded", { completedAt: new Date(), lastError: null });
    return {
      accountId: account.id,
      parent1Id: parent1Record.id,
      parent2Id: parent2Record.id,
      dealId: deal.id,
    };
  } catch (error) {
    await markSync("failed", {
      completedAt: null,
      lastError: "Zoho CRM sync was not completed. A staff retry is available.",
    });
    throw error;
  }
}

type AcademicYearZohoSync = (tutoringRequestId: string) => Promise<unknown>;

/**
 * A completed Stripe finalization remains successful when Zoho is unavailable.
 * The sync function persists a failed state that staff can retry safely.
 */
export async function syncAcademicYearAfterFinalization(
  tutoringRequestId: string,
  sync: AcademicYearZohoSync = syncAcademicYearRegistrationToZoho,
): Promise<AcademicYearZohoSyncStatus> {
  try {
    await sync(tutoringRequestId);
    return "succeeded";
  } catch {
    return "failed";
  }
}

/** The staff recovery path uses the same ID-first, search-fail-closed writer. */
export async function retryAcademicYearZohoSync(
  tutoringRequestId: string,
  sync: AcademicYearZohoSync = syncAcademicYearRegistrationToZoho,
) {
  return sync(tutoringRequestId);
}