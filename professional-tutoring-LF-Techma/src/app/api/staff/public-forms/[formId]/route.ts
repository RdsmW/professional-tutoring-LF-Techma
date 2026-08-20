import { NextResponse } from "next/server";
import {
  canManagePublicForm,
  discardPublicFormDraft,
  getPublicFormEditorState,
  isFormId,
  publishPublicFormVersion,
  rollbackPublicFormVersion,
  savePublicFormDraft,
} from "@/lib/staff/public-forms";
import { resolveStaffPortalGate } from "@/lib/auth/clerk";
import { getStaffContext } from "@/lib/staff/session";

type RouteContext = { params: Promise<{ formId: string }> };

async function contextFor(requestContext: RouteContext, permission: Parameters<typeof canManagePublicForm>[1]) {
  const { formId } = await requestContext.params;
  if (!isFormId(formId)) return { error: NextResponse.json({ ok: false, error: "Public form not found." }, { status: 404 }) };
  // API routes are not protected by the staff layout. Verify the Clerk role
  // before getStaffContext can provision a staff profile.
  const identity = await resolveStaffPortalGate("Staff");
  if (!identity.userId) return { error: NextResponse.json({ ok: false, error: "Sign in as staff to manage public forms." }, { status: 401 }) };
  if (identity.role !== "staff") return { error: NextResponse.json({ ok: false, error: "Staff access is required." }, { status: 403 }) };
  const staff = await getStaffContext();
  if (!staff) return { error: NextResponse.json({ ok: false, error: "Staff profile not found." }, { status: 404 }) };
  if (!canManagePublicForm(staff.staff.role, permission)) {
    return { error: NextResponse.json({ ok: false, error: "Your staff role cannot perform that form action." }, { status: 403 }) };
  }
  return { formId, staff };
}

export async function GET(_request: Request, routeContext: RouteContext) {
  try {
    const access = await contextFor(routeContext, "preview");
    if ("error" in access) return access.error;
    const state = await getPublicFormEditorState(access.formId);
    return NextResponse.json({
      ok: true,
      ...state,
      permissions: {
        edit: canManagePublicForm(access.staff.staff.role, "edit"),
        publish: canManagePublicForm(access.staff.staff.role, "publish"),
        archive: canManagePublicForm(access.staff.staff.role, "archive"),
        restore: canManagePublicForm(access.staff.staff.role, "restore"),
      },
    });
  } catch (error) {
    console.warn("[staff/public-forms] GET failed", error);
    return NextResponse.json({ ok: false, error: "Unable to load this public form." }, { status: 500 });
  }
}

export async function POST(request: Request, routeContext: RouteContext) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const action = typeof body?.action === "string" ? body.action : "";
    const permission =
      action === "save_draft" || action === "discard"
        ? "edit"
        : action === "publish"
          ? "publish"
          : action === "rollback"
            ? "restore"
            : null;
    if (!permission) return NextResponse.json({ ok: false, error: "Unsupported form action." }, { status: 400 });
    const access = await contextFor(routeContext, permission);
    if ("error" in access) return access.error;
    const actor = { staffId: access.staff.staff.id, staffName: access.staff.staff.fullName };

    if (action === "save_draft") {
      const result = await savePublicFormDraft({
        formId: access.formId,
        content: body?.content,
        expectedVersionId: typeof body?.expectedVersionId === "string" ? body.expectedVersionId : null,
        ...actor,
      });
      return NextResponse.json(result, { status: result.ok ? 200 : "conflict" in result && result.conflict ? 409 : 400 });
    }
    if (action === "publish") {
      const result = await publishPublicFormVersion({
        formId: access.formId,
        versionId: typeof body?.versionId === "string" ? body.versionId : "",
        reason: typeof body?.reason === "string" ? body.reason : "",
        ...actor,
      });
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }
    if (action === "discard") {
      const result = await discardPublicFormDraft({
        formId: access.formId,
        versionId: typeof body?.versionId === "string" ? body.versionId : "",
        ...actor,
      });
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }
    const result = await rollbackPublicFormVersion({
      formId: access.formId,
      sourceVersionId: typeof body?.sourceVersionId === "string" ? body.sourceVersionId : "",
      reason: typeof body?.reason === "string" ? body.reason : "",
      ...actor,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.warn("[staff/public-forms] POST failed", error);
    return NextResponse.json({ ok: false, error: "Unable to update this public form." }, { status: 500 });
  }
}