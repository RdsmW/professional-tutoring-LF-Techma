import { notFound } from "next/navigation";
import { StaffPublicFormEditorClient } from "@/components/staff-public-form-editor-client";
import { isFormId } from "@/lib/staff/public-forms";

export default async function StaffPublicFormEditPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  if (!isFormId(formId)) notFound();
  return <StaffPublicFormEditorClient formId={formId} />;
}