"use client";

import Link from "next/link";
import { useState } from "react";
import { PageIntro } from "@/components/ui";
import { PUBLIC_FORM_CATALOG, type PublicFormCatalogItem } from "@/lib/staff/public-form-catalog";
import { useDirectoryView } from "@/lib/ui/directory-view";

type Notice = { formId: string; message: string } | null;

function absoluteUrl(path: string) {
  return new URL(path, window.location.origin).toString();
}

function embedCode(form: PublicFormCatalogItem) {
  const url = absoluteUrl(form.publicPath!);
  return `<iframe src="${url}" title="${form.title}" width="100%" height="980" style="border: 0; max-width: 100%;" loading="lazy"></iframe>`;
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

export function StaffPublicFormsClient({ embedded = false }: { embedded?: boolean }) {
  const { view, setView } = useDirectoryView("pt.view.staff.public-forms", "cards");
  const [notice, setNotice] = useState<Notice>(null);
  const [embedFormId, setEmbedFormId] = useState<string | null>(null);

  const setSuccess = (formId: string, message: string) => {
    setNotice({ formId, message });
    window.setTimeout(() => {
      setNotice((current) => (current?.formId === formId ? null : current));
    }, 2600);
  };

  const copyPublicLink = async (form: PublicFormCatalogItem) => {
    if (!form.publicPath) return;
    try {
      await copyText(absoluteUrl(form.publicPath));
      setSuccess(form.id, "Public link copied.");
    } catch {
      setNotice({ formId: form.id, message: "Could not copy the public link. Please try again." });
    }
  };

  const shareForm = async (form: PublicFormCatalogItem) => {
    if (!form.publicPath) return;
    const url = absoluteUrl(form.publicPath);

    try {
      if (navigator.share) {
        await navigator.share({ title: form.title, text: `Register for ${form.title}.`, url });
        setSuccess(form.id, "Share sheet opened.");
        return;
      }
      await copyText(url);
      setSuccess(form.id, "Public link copied for sharing.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setNotice({ formId: form.id, message: "Could not share this form. Please try again." });
    }
  };

  const copyEmbedCode = async (form: PublicFormCatalogItem) => {
    if (!form.publicPath) return;
    try {
      await copyText(embedCode(form));
      setSuccess(form.id, "Embed code copied.");
    } catch {
      setNotice({ formId: form.id, message: "Could not copy the embed code. Please try again." });
    }
  };

  const renderActions = (form: PublicFormCatalogItem, compact = false) => {
    if (!form.publicPath) {
      return <span className="public-form-unavailable">Available after this public form is built.</span>;
    }

    return (
      <div className={`public-form-actions${compact ? " is-compact" : ""}`}>
        <Link href={form.publicPath} target="_blank" rel="noreferrer" className="secondary-button">
          Open form
        </Link>
        <button type="button" className="secondary-button" onClick={() => void copyPublicLink(form)}>
          Copy link
        </button>
        <button type="button" className="secondary-button" onClick={() => void shareForm(form)}>
          Share
        </button>
        <button
          type="button"
          className="secondary-button"
          aria-expanded={embedFormId === form.id}
          onClick={() => setEmbedFormId((current) => (current === form.id ? null : form.id))}
        >
          Embed
        </button>
      </div>
    );
  };

  const viewToggle = (
    <div className="directory-view-toggle public-forms-view-toggle" aria-label="Choose public forms view">
      <button
        type="button"
        className={view === "cards" ? "active" : ""}
        aria-pressed={view === "cards"}
        onClick={() => setView("cards")}
      >
        Cards
      </button>
      <button
        type="button"
        className={view === "table" ? "active" : ""}
        aria-pressed={view === "table"}
        onClick={() => setView("table")}
      >
        List
      </button>
    </div>
  );

  return (
    <>
      {embedded ? (
        <div className="public-forms-settings-toolbar">
          <div>
            <span className="eyebrow">Sharing and embeds</span>
            <h2>Public Forms</h2>
            <p>Share registration forms with families or copy an embed snippet for your website.</p>
          </div>
          {viewToggle}
        </div>
      ) : (
        <PageIntro
          eyebrow="Staff tools"
          title="Public Forms"
          description="Share registration forms with families or copy an embed snippet for your website."
          action={viewToggle}
        />
      )}

      <section className="public-forms-summary" aria-label="Public form status">
        <strong>1 active form</strong>
        <span>Academic Year Tutoring is ready to share. Four additional forms are prepared for their public launches.</span>
      </section>

      {view === "cards" ? (
        <section className="public-form-card-grid" aria-label="Public forms">
          {PUBLIC_FORM_CATALOG.map((form) => (
            <article className={`public-form-card ${form.status === "active" ? "is-active" : ""}`} key={form.id}>
              <div className="public-form-card-topline">
                <span className="public-form-kind">{form.journeyLabel}</span>
                <span className={`public-form-status ${form.status}`}>
                  {form.status === "active" ? "Active" : "Coming soon"}
                </span>
              </div>
              <h2>{form.title}</h2>
              <p>{form.description}</p>
              {form.publicPath ? (
                <div className="public-form-link-preview">
                  <span>Public link</span>
                  <code>{form.publicPath}</code>
                </div>
              ) : null}
              {renderActions(form)}
              {notice?.formId === form.id ? <p className="public-form-notice" role="status">{notice.message}</p> : null}
              {embedFormId === form.id && form.publicPath ? (
                <div className="public-form-embed">
                  <label htmlFor={`embed-${form.id}`}>Paste this code into your website</label>
                  <textarea id={`embed-${form.id}`} readOnly value={embedCode(form)} rows={5} />
                  <button type="button" className="primary-button" onClick={() => void copyEmbedCode(form)}>
                    Copy embed code
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ) : (
        <section className="table-panel public-forms-table" aria-label="Public forms list">
          <div className="table-head public-forms-table-grid">
            <span>Form</span>
            <span>Type</span>
            <span>Status</span>
            <span>Public link</span>
            <span>Actions</span>
          </div>
          {PUBLIC_FORM_CATALOG.map((form) => (
            <div className="table-row public-forms-table-grid public-forms-table-row" key={form.id}>
              <span className="public-forms-table-title">
                <strong>{form.title}</strong>
                <small>{form.description}</small>
              </span>
              <span>{form.journeyLabel}</span>
              <span className={`public-form-status ${form.status}`}>
                {form.status === "active" ? "Active" : "Coming soon"}
              </span>
              {form.publicPath ? <code className="public-forms-table-link">{form.publicPath}</code> : <span>—</span>}
              <span className="public-forms-table-actions">
                {renderActions(form, true)}
                {notice?.formId === form.id ? <small className="public-form-notice" role="status">{notice.message}</small> : null}
              </span>
              {embedFormId === form.id && form.publicPath ? (
                <div className="public-forms-table-embed">
                  <textarea aria-label={`Embed code for ${form.title}`} readOnly value={embedCode(form)} rows={4} />
                  <button type="button" className="secondary-button" onClick={() => void copyEmbedCode(form)}>
                    Copy embed code
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </section>
      )}
    </>
  );
}