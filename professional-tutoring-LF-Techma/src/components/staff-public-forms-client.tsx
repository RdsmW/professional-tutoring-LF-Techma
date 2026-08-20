"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import { IconClose, StaffIconButton } from "@/components/staff-action-icons";
import { PageIntro } from "@/components/ui";
import { PUBLIC_FORM_CATALOG, type PublicFormCatalogItem } from "@/lib/staff/public-form-catalog";
import { useDirectoryView } from "@/lib/ui/directory-view";

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
  const toast = useAppToast();
  const menuRef = useRef<HTMLDivElement>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [embedFormId, setEmbedFormId] = useState<string | null>(null);
  const [embedCopied, setEmbedCopied] = useState(false);

  const embedForm = PUBLIC_FORM_CATALOG.find((form) => form.id === embedFormId) ?? null;

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpenMenuId(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
        setEmbedFormId(null);
        setEmbedCopied(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const copyPublicLink = async (form: PublicFormCatalogItem) => {
    if (!form.publicPath) {
      toast.error("This public form is not available yet.");
      return;
    }
    try {
      await copyText(absoluteUrl(form.publicPath));
      toast.success("Public link copied.");
    } catch {
      toast.error("Could not copy the public link. Please try again.");
    }
  };

  const shareForm = async (form: PublicFormCatalogItem) => {
    if (!form.publicPath) {
      toast.error("This public form is not available yet.");
      return;
    }
    const url = absoluteUrl(form.publicPath);
    try {
      if (navigator.share) {
        await navigator.share({ title: form.title, text: `Register for ${form.title}.`, url });
        toast.success("Share sheet opened.");
        return;
      }
      await copyText(url);
      toast.success("Public link copied for sharing.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Could not share this form. Please try again.");
    }
  };

  const copyEmbedCode = async () => {
    if (!embedForm?.publicPath) return;
    try {
      await copyText(embedCode(embedForm));
      setEmbedCopied(true);
      toast.success("Embed code copied.");
    } catch {
      toast.error("Could not copy the embed code. Please try again.");
    }
  };

  const renderActionMenu = (form: PublicFormCatalogItem) => {
    const isOpen = openMenuId === form.id;
    const menuId = `public-form-actions-${form.id}`;
    return (
      <div className="public-form-menu" ref={isOpen ? menuRef : null}>
        <button
          type="button"
          className="public-form-menu-trigger"
          aria-label={`Actions for ${form.title}`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
          onClick={() => setOpenMenuId((current) => (current === form.id ? null : form.id))}
        >
          <span aria-hidden="true">⋮</span>
        </button>
        {isOpen ? (
          <div id={menuId} className="public-form-menu-popover" role="menu" aria-label={`Actions for ${form.title}`}>
            {form.publicPath ? (
              <Link
                href={form.publicPath}
                target="_blank"
                rel="noreferrer"
                role="menuitem"
                onClick={() => setOpenMenuId(null)}
              >
                Open
              </Link>
            ) : (
              <button type="button" role="menuitem" disabled>
                Open
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              disabled={!form.publicPath}
              onClick={() => {
                setOpenMenuId(null);
                void copyPublicLink(form);
              }}
            >
              Copy link
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={!form.publicPath}
              onClick={() => {
                setOpenMenuId(null);
                void shareForm(form);
              }}
            >
              Share
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={!form.publicPath}
              onClick={() => {
                setOpenMenuId(null);
                setEmbedCopied(false);
                setEmbedFormId(form.id);
              }}
            >
              Embed
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpenMenuId(null);
                toast.info("Form editing is not available yet.");
              }}
            >
              Edit
            </button>
          </div>
        ) : null}
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
      <AppToastHost toasts={toast.toasts} onDismiss={toast.dismiss} />
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
                <div className="public-form-card-controls">
                  <span className={`public-form-status ${form.status}`}>
                    {form.status === "active" ? "Active" : "Coming soon"}
                  </span>
                  {renderActionMenu(form)}
                </div>
              </div>
              <h2>{form.title}</h2>
              <p>{form.description}</p>
              {form.publicPath ? (
                <div className="public-form-link-preview">
                  <span>Public link</span>
                  <code>{form.publicPath}</code>
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
            <span aria-label="Actions" />
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
              <span className="public-forms-table-actions">{renderActionMenu(form)}</span>
            </div>
          ))}
        </section>
      )}

      {embedForm?.publicPath ? (
        <div
          className="staff-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEmbedFormId(null);
            if (event.target === event.currentTarget) setEmbedCopied(false);
          }}
        >
          <div
            className="staff-modal public-form-embed-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="embed-form-title"
            aria-describedby="embed-form-description"
          >
            <div className="family-list-modal-header">
              <div>
                <h3 id="embed-form-title">Embed {embedForm.title}</h3>
                <p id="embed-form-description">Paste this code into your website.</p>
              </div>
              <StaffIconButton
                label="Close"
                tone="muted"
                onClick={() => {
                  setEmbedFormId(null);
                  setEmbedCopied(false);
                }}
              >
                <IconClose size={18} />
              </StaffIconButton>
            </div>
            <textarea
              aria-label={`Embed code for ${embedForm.title}`}
              readOnly
              value={embedCode(embedForm)}
              rows={6}
              onFocus={(event) => event.currentTarget.select()}
            />
            {embedCopied ? (
              <p className="public-form-copy-confirmation" role="status">
                Embed code copied to your clipboard.
              </p>
            ) : null}
            <div className="staff-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setEmbedFormId(null);
                  setEmbedCopied(false);
                }}
              >
                Close
              </button>
              <button type="button" className="primary-button" onClick={() => void copyEmbedCode()}>
                {embedCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}