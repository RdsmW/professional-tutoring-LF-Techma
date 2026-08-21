import { deactivateNonProductionAcademicYearAvailability } from "../src/lib/booking/non-production-academic-year-availability";

export default async function globalTeardown() {
  if (!process.env.DATABASE_URL) return;
  process.env.AY_TUTORING_TEST_AVAILABILITY = "true";
  await deactivateNonProductionAcademicYearAvailability();
}