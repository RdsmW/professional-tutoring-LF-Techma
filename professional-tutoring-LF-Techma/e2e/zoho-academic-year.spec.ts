import { expect, test } from "@playwright/test";
import {
  academicYearZohoSource,
  confirmedZohoFields,
  findOrCreateZohoRecord,
  retryAcademicYearZohoSync,
  syncAcademicYearAfterFinalization,
  ZOHO_ACADEMIC_YEAR_DEAL_FIELDS,
  ZOHO_ACADEMIC_YEAR_EXCLUDED_FIELDS,
  type ZohoData,
} from "../src/lib/zoho/academic-year";

test("uses only confirmed non-financial Academic Year Deal fields", () => {
  const payload = confirmedZohoFields(
    {
      Deal_Name: "Student - payer@example.test",
      Stage: "Qualification",
      Form_Filled_For: "Tutoring: Academic Year",
      Billing_Email1: "payer@example.test",
      Amount: 100,
      Total_Due2: 100,
      Total_Fees: 10,
      Auto_Charge: true,
      Alternative_Payment: "check",
      Card_Number: "never-send",
    },
    ZOHO_ACADEMIC_YEAR_DEAL_FIELDS,
  );

  expect(payload).toEqual({
    Deal_Name: "Student - payer@example.test",
    Stage: "Qualification",
    Form_Filled_For: "Tutoring: Academic Year",
    Billing_Email1: "payer@example.test",
  });
  expect(Object.keys(payload).some((field) => ZOHO_ACADEMIC_YEAR_EXCLUDED_FIELDS.includes(field as never))).toBe(false);
});

test("maps only confirmed Zoho source picklist values", () => {
  expect(academicYearZohoSource("google")).toBe("Google");
  expect(academicYearZohoSource("family")).toBe("Family");
  expect(academicYearZohoSource("unrecognized referral")).toBe("Other");
});

test("automatically triggers Zoho sync after a successful Academic Year finalization", async () => {
  const calls: string[] = [];
  const status = await syncAcademicYearAfterFinalization("registration-1", async (requestId) => {
    calls.push(requestId);
  });

  expect(status).toBe("succeeded");
  expect(calls).toEqual(["registration-1"]);
});

test("isolates a Zoho sync failure from a completed Academic Year finalization", async () => {
  const status = await syncAcademicYearAfterFinalization("registration-1", async () => {
    throw new Error("Zoho unavailable");
  });

  expect(status).toBe("failed");
});

test("staff retry delegates to the same safe Academic Year sync operation", async () => {
  const calls: string[] = [];
  await retryAcademicYearZohoSync("registration-1", async (requestId) => {
    calls.push(requestId);
  });

  expect(calls).toEqual(["registration-1"]);
});

test("updates the stored Zoho ID without searching or creating", async () => {
  const calls: string[] = [];
  const client = {
    find: async () => {
      calls.push("find");
      return [] as ZohoData[];
    },
    create: async () => {
      calls.push("create");
      return { id: "created", url: null };
    },
    update: async (_module: "Accounts" | "Contacts" | "Deals", id: string) => {
      calls.push(`update:${id}`);
      return { id, url: null };
    },
  };

  const result = await findOrCreateZohoRecord(
    client,
    "Accounts",
    "stored-account",
    "Account_Name",
    "Family - payer@example.test",
    ["id"],
    { Account_Name: "Family - payer@example.test" },
  );

  expect(result.id).toBe("stored-account");
  expect(calls).toEqual(["update:stored-account"]);
});

test("updates an exact existing Zoho record instead of creating a duplicate", async () => {
  const calls: string[] = [];
  const client = {
    find: async () => {
      calls.push("find");
      return [{ id: "existing-account" }] as ZohoData[];
    },
    create: async () => {
      calls.push("create");
      return { id: "created", url: null };
    },
    update: async (_module: "Accounts" | "Contacts" | "Deals", id: string) => {
      calls.push(`update:${id}`);
      return { id, url: null };
    },
  };

  const result = await findOrCreateZohoRecord(
    client,
    "Accounts",
    null,
    "Account_Name",
    "Family - payer@example.test",
    ["id"],
    { Account_Name: "Family - payer@example.test" },
  );

  expect(result.id).toBe("existing-account");
  expect(calls).toEqual(["find", "update:existing-account"]);
});

test("creates a Zoho record only when no stored or exact existing ID is available", async () => {
  const calls: string[] = [];
  const client = {
    find: async () => {
      calls.push("find");
      return [] as ZohoData[];
    },
    create: async () => {
      calls.push("create");
      return { id: "created-account", url: null };
    },
    update: async () => {
      calls.push("update");
      return { id: "updated", url: null };
    },
  };

  const result = await findOrCreateZohoRecord(
    client,
    "Accounts",
    null,
    "Account_Name",
    "Family - payer@example.test",
    ["id"],
    { Account_Name: "Family - payer@example.test" },
  );

  expect(result.id).toBe("created-account");
  expect(calls).toEqual(["find", "create"]);
});

test("fails closed when the Zoho search is unavailable", async () => {
  const calls: string[] = [];
  const client = {
    find: async () => {
      calls.push("find");
      throw new Error("search unavailable");
    },
    create: async () => {
      calls.push("create");
      return { id: "created-account", url: null };
    },
    update: async () => {
      calls.push("update");
      return { id: "updated-account", url: null };
    },
  };

  await expect(
    findOrCreateZohoRecord(
      client,
      "Accounts",
      null,
      "Account_Name",
      "Family - payer@example.test",
      ["id"],
      { Account_Name: "Family - payer@example.test" },
    ),
  ).rejects.toThrow("search unavailable");
  expect(calls).toEqual(["find"]);
});