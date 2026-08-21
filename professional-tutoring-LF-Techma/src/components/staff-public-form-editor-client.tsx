"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import type { FormValidationIssue, PublicFormContent, PublicFormField } from "@/lib/forms/public-form-schema";
import { PROTECTED_FIELD_IDS, PUBLIC_RENDERER_EDITABLE_FIELD_IDS } from "@/lib/forms/public-form-schema";
import type { FormId } from "@/lib/forms/types";

type Version = {
  id: string;
  versionNumber: number;
  status: "draft" | "published" | "retired";
  content: PublicFormContent;
  changeReason: string | null;
  createdAt: string;
  publishedAt: string | null;
};

type EditorState = {
  form: { id: FormId; publicPath: string | null; status: string };
  draft: Version | null;
  published: Version | null;
  versions: Version[];
  audit: Array<{ id: string; action: string; reason: string | null; createdAt: string; versionId: string | null }>;
  permissions: { edit: boolean; publish: boolean; archive: boolean; restore: boolean };
};

type ConfirmAction =
  | { kind: "publish" }
  | { kind: "rollback"; version: Version }
  | null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
}

export function StaffPublicFormEditorClient({ formId }: { formId: FormId }) {
  const toast = useAppToast();
  const [state, setState] = useState<EditorState | null>(null);
  const [content, setContent] = useState<PublicFormContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [issues, setIssues] = useState<FormValidationIssue[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [reason, setReason] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/public-forms/${formId}`);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Unable to load the form.");
      const next = data as EditorState;
      setState(next);
      setContent(clone((next.draft ?? next.published)?.content ?? null));
      setIssues([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load the form.");
    } finally {
      setLoading(false);
    }
  }, [formId, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const draftVersionId = state?.draft?.id ?? null;
  const canEdit = Boolean(state?.permissions.edit);

  function changeMetadata(key: "title" | "description" | "introduction" | "helpText", value: string) {
    setContent((current) => (current ? { ...current, [key]: value } : current));
  }

  function changeStep(index: number, key: "name" | "helpText", value: string) {
    setContent((current) => {
      if (!current) return current;
      const steps = current.steps.map((step, stepIndex) => (stepIndex === index ? { ...step, [key]: value } : step));
      return { ...current, steps };
    });
  }

  function moveStep(index: number, direction: -1 | 1) {
    setContent((current) => {
      if (!current || index + direction < 0 || index + direction >= current.steps.length) return current;
      const steps = [...current.steps];
      [steps[index], steps[index + direction]] = [steps[index + direction], steps[index]];
      return { ...current, steps: steps.map((step, order) => ({ ...step, order })) };
    });
  }

  function changeField(stepIndex: number, fieldIndex: number, patch: Partial<PublicFormField>) {
    setContent((current) => {
      if (!current) return current;
      const steps = current.steps.map((step, currentStepIndex) => {
        if (currentStepIndex !== stepIndex) return step;
        return {
          ...step,
          fields: step.fields.map((field, currentFieldIndex) =>
            currentFieldIndex === fieldIndex ? { ...field, ...patch } : field,
          ),
        };
      });
      return { ...current, steps };
    });
  }

  function moveField(stepIndex: number, fieldIndex: number, direction: -1 | 1) {
    setContent((current) => {
      if (!current) return current;
      const steps = current.steps.map((step, index) => {
        if (index !== stepIndex || fieldIndex + direction < 0 || fieldIndex + direction >= step.fields.length) return step;
        const fields = [...step.fields];
        [fields[fieldIndex], fields[fieldIndex + direction]] = [fields[fieldIndex + direction], fields[fieldIndex]];
        return { ...step, fields: fields.map((field, order) => ({ ...field, order })) };
      });
      return { ...current, steps };
    });
  }

  async function act(payload: Record<string, unknown>) {
    const response = await fetch(`/api/staff/public-forms/${formId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setIssues(Array.isArray(data.issues) ? data.issues : []);
      throw new Error(data.error || data.issues?.[0]?.message || "Unable to update the form.");
    }
    return data;
  }

  async function saveDraft() {
    if (!content || !canEdit) return;
    setSaving(true);
    setIssues([]);
    try {
      await act({ action: "save_draft", content, expectedVersionId: draftVersionId });
      toast.success("Draft saved. The live public form has not changed.");
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the draft.");
    } finally {
      setSaving(false);
    }
  }

  async function discard() {
    if (!draftVersionId || !canEdit) return;
    if (!window.confirm("Discard this saved draft? The published form will remain unchanged.")) return;
    setSaving(true);
    try {
      await act({ action: "discard", versionId: draftVersionId });
      toast.success("Draft discarded.");
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to discard the draft.");
    } finally {
      setSaving(false);
    }
  }

  async function confirm() {
    if (!confirmAction) return;
    setSaving(true);
    setIssues([]);
    try {
      if (confirmAction.kind === "publish") {
        if (!draftVersionId) throw new Error("Save a draft before publishing.");
        await act({ action: "publish", versionId: draftVersionId, reason });
        toast.success("Published version is now live.");
      } else {
        await act({ action: "rollback", sourceVersionId: confirmAction.version.id, reason });
        toast.success(`Version ${confirmAction.version.versionNumber} has been restored as the live version.`);
      }
      setConfirmAction(null);
      setReason("");
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to publish this version.");
    } finally {
      setSaving(false);
    }
  }

  const versionToPublish = useMemo(() => state?.draft ?? null, [state]);

  if (loading && !state) {
    return <p className="staff-editor-loading">Loading public form editor…</p>;
  }
  if (!state || !content) {
    return <p className="staff-editor-loading">This editor could not be loaded.</p>;
  }

  return (
    <>
      <AppToastHost toasts={toast.toasts} onDismiss={toast.dismiss} />
      <div className="public-form-editor-header">
        <div>
          <Link className="public-form-editor-back" href="/staff/settings?tab=public-forms">
            ← Public Forms
          </Link>
          <p className="eyebrow">Public form editor</p>
          <h1>{content.title}</h1>
          <p>Work in a draft. Publishing requires a reason and never changes historical submissions.</p>
        </div>
        <div className="public-form-editor-header-actions">
          {state.form.publicPath ? (
            <Link className="secondary-button" href={state.form.publicPath} target="_blank" rel="noreferrer">
              Open live form
            </Link>
          ) : null}
          <button type="button" className="secondary-button" onClick={() => setShowPreview((current) => !current)}>
            {showPreview ? "Close preview" : "Preview draft"}
          </button>
        </div>
      </div>

      <div className="public-form-editor-safety">
        <strong>Protected workflow inputs stay locked.</strong>
        <span>Payment, consent, availability, identity matching, capacity, tutor matching, and booking rules continue to run on the server.</span>
      </div>

      {issues.length ? (
        <section className="public-form-editor-issues" aria-live="polite">
          <strong>Resolve these before saving or publishing</strong>
          <ul>{issues.map((issue, index) => <li key={`${issue.path}-${index}`}>{issue.message}</li>)}</ul>
        </section>
      ) : null}

      {showPreview ? (
        <section className="public-form-preview" aria-label="Draft preview">
          <p className="eyebrow">Draft preview</p>
          <h2>{content.title}</h2>
          <p>{content.description}</p>
          <div className="public-form-preview-copy">
            <p>{content.introduction}</p>
            {content.helpText ? <p>{content.helpText}</p> : null}
          </div>
          <ol>
            {content.steps.map((step) => <li key={step.key}><strong>{step.name}</strong>{step.helpText ? <span>{step.helpText}</span> : null}</li>)}
          </ol>
        </section>
      ) : null}

      <section className="public-form-editor-panel">
        <div className="public-form-editor-panel-head">
          <div><p className="eyebrow">Form information</p><h2>Family-facing content</h2></div>
          {!canEdit ? <span className="pill amber">Preview only</span> : null}
        </div>
        <div className="public-form-editor-meta">
          <label>Form title<input value={content.title} disabled={!canEdit} onChange={(event) => changeMetadata("title", event.target.value)} /></label>
          <label>Short description<textarea rows={2} value={content.description} disabled={!canEdit} onChange={(event) => changeMetadata("description", event.target.value)} /></label>
          <label>Introduction<textarea rows={3} value={content.introduction} disabled={!canEdit} onChange={(event) => changeMetadata("introduction", event.target.value)} /></label>
          <label>Help text<textarea rows={2} value={content.helpText} disabled={!canEdit} onChange={(event) => changeMetadata("helpText", event.target.value)} /></label>
        </div>
      </section>

      <section className="public-form-editor-panel">
        <div className="public-form-editor-panel-head">
          <div><p className="eyebrow">Structure</p><h2>Steps and supported fields</h2></div>
          <span className="public-form-editor-hint">Only declared fields and safe validation settings are available.</span>
        </div>
        <div className="public-form-editor-steps">
          {content.steps.map((step, stepIndex) => (
            <article className="public-form-editor-step" key={step.key}>
              <div className="public-form-editor-step-head">
                <div>
                  <span className="public-form-editor-order">Step {stepIndex + 1}</span>
                  <label>Step name<input value={step.name} disabled={!canEdit} onChange={(event) => changeStep(stepIndex, "name", event.target.value)} /></label>
                </div>
                <div className="public-form-editor-move">
                  <button type="button" disabled={!canEdit || stepIndex === 0} onClick={() => moveStep(stepIndex, -1)}>Move up</button>
                  <button type="button" disabled={!canEdit || stepIndex === content.steps.length - 1} onClick={() => moveStep(stepIndex, 1)}>Move down</button>
                </div>
              </div>
              <label className="public-form-editor-step-help">Step help text<textarea rows={2} value={step.helpText} disabled={!canEdit} onChange={(event) => changeStep(stepIndex, "helpText", event.target.value)} /></label>
              {step.fields.length ? (
                <div className="public-form-editor-fields">
                  {step.fields.map((field, fieldIndex) => {
                    const protectedField = PROTECTED_FIELD_IDS.has(field.id);
                    const rendererEditable = PUBLIC_RENDERER_EDITABLE_FIELD_IDS.has(field.id);
                    return (
                      <div className="public-form-editor-field" key={field.id}>
                        <div className="public-form-editor-field-title">
                          <strong>{field.id.replaceAll("_", " ")}</strong>
                          {protectedField ? <span className="pill amber">Protected</span> : <span className="pill blue">Optional display</span>}
                          {rendererEditable ? <span className="public-form-editor-field-move">
                            <button type="button" disabled={!canEdit || fieldIndex === 0} onClick={() => moveField(stepIndex, fieldIndex, -1)}>↑</button>
                            <button type="button" disabled={!canEdit || fieldIndex === step.fields.length - 1} onClick={() => moveField(stepIndex, fieldIndex, 1)}>↓</button>
                          </span> : null}
                        </div>
                        {rendererEditable ? <div className="public-form-editor-field-grid">
                          <label>Label<input value={field.label} disabled={!canEdit} onChange={(event) => changeField(stepIndex, fieldIndex, { label: event.target.value })} /></label>
                          <label>Placeholder<input value={field.placeholder} disabled={!canEdit} onChange={(event) => changeField(stepIndex, fieldIndex, { placeholder: event.target.value })} /></label>
                          <label className="public-form-editor-check"><input type="checkbox" checked={field.visible} disabled={!canEdit || protectedField} onChange={(event) => changeField(stepIndex, fieldIndex, { visible: event.target.checked })} />Visible to families</label>
                          <label className="public-form-editor-check"><input type="checkbox" checked={field.required} disabled={!canEdit || protectedField} onChange={(event) => changeField(stepIndex, fieldIndex, { required: event.target.checked })} />Required</label>
                        </div> : <p className="public-form-editor-empty">This compound or workflow-managed input is preserved by the live registration flow and cannot be changed here.</p>}
                      </div>
                    );
                  })}
                </div>
              ) : <p className="public-form-editor-empty">This step has no editable fields. Its name and help text can still be updated.</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="public-form-editor-panel public-form-editor-actions">
        <div><h2>Draft controls</h2><p>{state.draft ? `Draft version ${state.draft.versionNumber} is not public yet.` : "You are editing a local copy of the published version."}</p></div>
        <div>
          <button type="button" className="secondary-button" disabled={!canEdit || saving || !state.draft} onClick={() => void discard()}>Discard draft</button>
          <button type="button" className="primary-button" disabled={!canEdit || saving} onClick={() => void saveDraft()}>{saving ? "Saving…" : "Save draft"}</button>
          <button type="button" className="family-primary" disabled={!state.permissions.publish || saving || !versionToPublish} onClick={() => { setReason(""); setConfirmAction({ kind: "publish" }); }}>Publish draft</button>
        </div>
      </section>

      <section className="public-form-editor-panel">
        <div className="public-form-editor-panel-head"><div><p className="eyebrow">Audit trail</p><h2>Published and historical versions</h2></div></div>
        <div className="public-form-version-list">
          {state.versions.map((version) => (
            <div className="public-form-version-row" key={version.id}>
              <div><strong>Version {version.versionNumber}</strong><span className={`public-form-version-status ${version.status}`}>{version.status}</span><small>{version.publishedAt ? `Published ${formatDate(version.publishedAt)}` : `Created ${formatDate(version.createdAt)}`}{version.changeReason ? ` · ${version.changeReason}` : ""}</small></div>
              {state.permissions.restore && version.status !== "draft" && version.id !== state.published?.id ? <button type="button" className="secondary-button" disabled={saving} onClick={() => { setReason(""); setConfirmAction({ kind: "rollback", version }); }}>Restore this version</button> : null}
            </div>
          ))}
        </div>
        {state.audit.length ? <ul className="public-form-audit-list">{state.audit.map((event) => <li key={event.id}><strong>{event.action.replaceAll("_", " ")}</strong> · {formatDate(event.createdAt)}{event.reason ? ` · ${event.reason}` : ""}</li>)}</ul> : null}
      </section>

      {confirmAction ? (
        <div className="staff-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setConfirmAction(null); }}>
          <div className="staff-modal staff-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="public-form-confirm-title">
            <div className="family-list-modal-header"><div><h3 id="public-form-confirm-title">{confirmAction.kind === "publish" ? "Publish this draft?" : `Restore version ${confirmAction.version.versionNumber}?`}</h3><p>{confirmAction.kind === "publish" ? "This is the only action that changes the live public form." : "The earlier immutable version will become the current live form."}</p></div></div>
            <label className="full-input">Change reason (required)<textarea autoFocus rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain the change for the audit trail" /></label>
            <div className="staff-modal-actions"><button type="button" className="secondary-button" disabled={saving} onClick={() => setConfirmAction(null)}>Cancel</button><button type="button" className="family-primary" disabled={saving || !reason.trim()} onClick={() => void confirm()}>{saving ? "Working…" : confirmAction.kind === "publish" ? "Publish live form" : "Restore live version"}</button></div>
          </div>
        </div>
      ) : null}
    </>
  );
}