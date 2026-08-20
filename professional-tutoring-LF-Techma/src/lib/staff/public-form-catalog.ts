import { FORM_META } from "@/lib/forms";
import type { FormId } from "@/lib/forms";

export type PublicFormStatus = "active" | "coming_soon";

export type PublicFormCatalogItem = {
  id: FormId;
  title: string;
  description: string;
  journeyLabel: "Tutoring" | "Test prep";
  status: PublicFormStatus;
  publicPath: string | null;
};

/**
 * Fixed public-form catalogue. A database table is unnecessary until staff
 * need to create, customize, or expire form links.
 */
export const PUBLIC_FORM_CATALOG: PublicFormCatalogItem[] = [
  {
    id: "academic_year_tutoring",
    title: FORM_META.academic_year_tutoring.title,
    description: "Academic-year tutoring registration, scheduling preference, and payment setup.",
    journeyLabel: "Tutoring",
    status: "active",
    publicPath: "/register/academic-year-tutoring",
  },
  {
    id: "summer_tutoring",
    title: FORM_META.summer_tutoring.title,
    description: "Summer tutoring registration and scheduling.",
    journeyLabel: "Tutoring",
    status: "coming_soon",
    publicPath: null,
  },
  {
    id: "first_class",
    title: FORM_META.first_class.title,
    description: "Nine-month SAT/ACT course enrollment.",
    journeyLabel: "Test prep",
    status: "coming_soon",
    publicPath: null,
  },
  {
    id: "express",
    title: FORM_META.express.title,
    description: "Six-month SAT/ACT Express course enrollment.",
    journeyLabel: "Test prep",
    status: "coming_soon",
    publicPath: null,
  },
  {
    id: "summer_master_class",
    title: FORM_META.summer_master_class.title,
    description: "SAT Master Class summer enrollment.",
    journeyLabel: "Test prep",
    status: "coming_soon",
    publicPath: null,
  },
];