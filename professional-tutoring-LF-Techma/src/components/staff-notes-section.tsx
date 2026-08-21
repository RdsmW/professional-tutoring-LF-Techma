"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Panel } from "@/components/ui";
import {
  IconClose,
  IconPencil,
  IconTrash,
  StaffIconButton,
} from "@/components/staff-action-icons";
import { formatStaffDateTime } from "@/lib/ui/datetime";

/** Shared note shape for Family / Guardian (and later Student / Tutor) staff notes UI. */
export type StaffNoteItem = {
  id: string;
  body: string;
  authorDisplayName: string;
  createdAt: string;
  editorDisplayName: string | null;
  updatedAt: string | null;
};

const PREVIEW_LIMIT = 3;

function formatWhen(value: string | null | undefined) {
  return formatStaffDateTime(value);
}

function noteEditedBy(note: StaffNoteItem) {
  return note.editorDisplayName?.trim() || "—";
}

function noteEditedAt(note: StaffNoteItem) {
  if (note.editorDisplayName?.trim() || note.updatedAt) {
    return formatWhen(note.updatedAt);
  }
  return "—";
}

function ConfirmDeleteModal({
  busy,
  onCancel,
  onConfirm,
}: {
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div
      className="staff-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="staff-modal staff-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-notes-delete-title"
      >
        <h3 id="staff-notes-delete-title">Delete this note?</h3>
        <div className="staff-confirm-modal-body">
          <p>The note moves to Settings → Recycle bin for 30 days, then is permanently removed.</p>
        </div>
        <div className="staff-modal-actions">
          <button type="button" className="secondary-button" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="danger-button" disabled={busy} onClick={onConfirm}>
            {busy ? "Working…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotesListPreview({
  total,
  empty,
  onViewMore,
  children,
}: {
  total: number;
  empty: ReactNode;
  onViewMore: () => void;
  children: ReactNode;
}) {
  if (total === 0) return <>{empty}</>;
  return (
    <div className="family-list-preview-shell">
      <div className="family-list-preview">{children}</div>
      {total > PREVIEW_LIMIT ? (
        <button type="button" className="text-button family-view-more" onClick={onViewMore}>
          View more
        </button>
      ) : null}
    </div>
  );
}

function NotesListModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="staff-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="staff-modal family-list-modal family-notes-list-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-notes-list-modal-title"
      >
        <div className="family-list-modal-header">
          <h3 id="staff-notes-list-modal-title">{title}</h3>
          <StaffIconButton label="Close" title="Cancel" tone="muted" onClick={onClose}>
            <IconClose size={18} />
          </StaffIconButton>
        </div>
        <div className="family-list-modal-body">{children}</div>
      </div>
    </div>
  );
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export type StaffNotesSectionProps = {
  notes: StaffNoteItem[];
  /** Entity-specific create (Family / Guardian / … APIs). Return the created note; throw on failure. */
  onCreate: (body: string) => Promise<StaffNoteItem>;
  /** Entity-specific update. Return the updated note; throw on failure. */
  onUpdate: (noteId: string, body: string) => Promise<StaffNoteItem>;
  /** Entity-specific soft-delete. Throw on failure. */
  onDelete: (noteId: string) => Promise<void>;
  /** Use the parent page toast host so messages appear consistently. */
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  helperText?: string;
  /**
   * `split` (default): Add note card + Notes list.
   * `list`: full-width Notes only; parent opens the composer (e.g. toolbar icon).
   */
  layout?: "split" | "list";
  composerOpen?: boolean;
  onComposerOpenChange?: (open: boolean) => void;
};

/**
 * Shared staff Notes UI (add + list + edit/delete).
 * Keep entity APIs behind callbacks — do not merge DB note tables.
 */
export function StaffNotesSection({
  notes,
  onCreate,
  onUpdate,
  onDelete,
  onSuccess,
  onError,
  helperText = "Internal only — not visible in the family portal.",
  layout = "split",
  composerOpen = false,
  onComposerOpenChange,
}: StaffNotesSectionProps) {
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteEditDraft, setNoteEditDraft] = useState("");
  const [savingNoteEdit, setSavingNoteEdit] = useState(false);
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [listModalOpen, setListModalOpen] = useState(false);

  const previewNotes = notes.slice(0, PREVIEW_LIMIT);
  const editingNote = editingNoteId ? notes.find((note) => note.id === editingNoteId) ?? null : null;
  const showComposerModal = layout === "list" && composerOpen;

  useEffect(() => {
    if (!showComposerModal) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !savingNotes) onComposerOpenChange?.(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onComposerOpenChange, savingNotes, showComposerModal]);

  function startEditNote(note: StaffNoteItem) {
    setEditingNoteId(note.id);
    setNoteEditDraft(note.body);
  }

  function cancelEditNote() {
    setEditingNoteId(null);
    setNoteEditDraft("");
  }

  async function addNote(event: FormEvent) {
    event.preventDefault();
    if (!noteDraft.trim() || savingNotes) return;
    setSavingNotes(true);
    try {
      await onCreate(noteDraft);
      setNoteDraft("");
      onComposerOpenChange?.(false);
      onSuccess("Note added.");
    } catch (error) {
      onError(errorMessage(error, "Unable to add note."));
    } finally {
      setSavingNotes(false);
    }
  }

  function closeComposer() {
    if (savingNotes) return;
    onComposerOpenChange?.(false);
  }

  async function saveNoteEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingNoteId || !noteEditDraft.trim() || savingNoteEdit) return;
    setSavingNoteEdit(true);
    try {
      await onUpdate(editingNoteId, noteEditDraft);
      setEditingNoteId(null);
      setNoteEditDraft("");
      onSuccess("Note updated.");
    } catch (error) {
      onError(errorMessage(error, "Unable to update note."));
    } finally {
      setSavingNoteEdit(false);
    }
  }

  async function deleteNote(noteId: string) {
    if (deletingNoteId) return;
    setDeletingNoteId(noteId);
    try {
      await onDelete(noteId);
      if (editingNoteId === noteId) cancelEditNote();
      setConfirmDeleteNoteId(null);
      onSuccess("Note moved to Recycle bin.");
    } catch (error) {
      onError(errorMessage(error, "Unable to delete note."));
    } finally {
      setDeletingNoteId(null);
    }
  }

  function renderNotesTable(rows: StaffNoteItem[]) {
    return (
      <div className="family-notes-table-wrap">
        <table className="family-notes-table">
          <thead>
            <tr>
              <th className="family-notes-col-content">Note</th>
              <th className="family-notes-col-who">Created By</th>
              <th className="family-notes-col-when">Created Time</th>
              <th className="family-notes-col-who">Edited By</th>
              <th className="family-notes-col-when">Edited Time</th>
              <th className="family-notes-col-edit" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((note) => (
              <tr
                key={note.id}
                className="family-notes-row-clickable"
                tabIndex={0}
                role="button"
                aria-label="Edit note"
                onClick={() => startEditNote(note)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    startEditNote(note);
                  }
                }}
              >
                <td className="family-notes-col-content">
                  <span className="family-notes-body">{note.body}</span>
                </td>
                <td className="family-notes-col-who">{note.authorDisplayName}</td>
                <td className="family-notes-col-when">{formatWhen(note.createdAt)}</td>
                <td className="family-notes-col-who">{noteEditedBy(note)}</td>
                <td className="family-notes-col-when">{noteEditedAt(note)}</td>
                <td className="family-notes-col-edit">
                  <div className="family-notes-action-group" onClick={(event) => event.stopPropagation()}>
                    <StaffIconButton
                      label="Edit"
                      title="Edit"
                      tone="edit"
                      className="family-notes-edit-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        startEditNote(note);
                      }}
                    >
                      <IconPencil size={14} />
                    </StaffIconButton>
                    <StaffIconButton
                      label="Delete"
                      title="Delete"
                      tone="danger"
                      className="family-notes-edit-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        setConfirmDeleteNoteId(note.id);
                      }}
                    >
                      <IconTrash size={14} />
                    </StaffIconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div
        className={
          layout === "list"
            ? "family-notes-layout family-notes-layout-list staff-equal-cards"
            : "family-notes-layout staff-equal-cards"
        }
      >
        {layout === "split" ? (
          <Panel className="family-notes-panel family-equal-panel">
            <div className="family-panel-heading">
              <h2>Add note</h2>
            </div>
            <div className="family-add-note-stretch">
              <p className="family-add-note-helper">{helperText}</p>
              <form onSubmit={(event) => void addNote(event)}>
                <label className="family-add-note-label">
                  <span className="sr-only">Note</span>
                  <textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    rows={4}
                    placeholder="Add a staff note…"
                  />
                </label>
                <div className="family-add-note-footer">
                  <button
                    type="submit"
                    className="primary-button family-add-note-btn"
                    disabled={savingNotes || !noteDraft.trim()}
                  >
                    {savingNotes ? "Adding…" : "Add note"}
                  </button>
                </div>
              </form>
            </div>
          </Panel>
        ) : null}

        <Panel className="family-notes-panel family-equal-panel">
          <div className="family-panel-heading">
            <h2>Notes</h2>
          </div>
          <NotesListPreview
            total={notes.length}
            empty={<p className="family-empty">No notes yet.</p>}
            onViewMore={() => setListModalOpen(true)}
          >
            {renderNotesTable(previewNotes)}
          </NotesListPreview>
        </Panel>
      </div>

      {showComposerModal ? (
        <div
          className="staff-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingNotes) closeComposer();
          }}
        >
          <div
            className="staff-modal family-note-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-note-add-title"
          >
            <div className="family-list-modal-header">
              <h3 id="staff-note-add-title">Add note</h3>
              <StaffIconButton label="Close" title="Cancel" tone="muted" disabled={savingNotes} onClick={closeComposer}>
                <IconClose size={18} />
              </StaffIconButton>
            </div>
            <form onSubmit={(event) => void addNote(event)} className="staff-modal-form family-note-edit-form">
              <p className="family-add-note-helper">{helperText}</p>
              <label className="family-note-edit-field">
                Note
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  rows={5}
                  placeholder="Add a staff note…"
                  autoFocus
                />
              </label>
              <div className="staff-modal-actions">
                <button type="button" className="secondary-button" disabled={savingNotes} onClick={closeComposer}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingNotes || !noteDraft.trim()}
                >
                  {savingNotes ? "Adding…" : "Add note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {listModalOpen ? (
        <NotesListModal title="Notes" onClose={() => setListModalOpen(false)}>
          {renderNotesTable(notes)}
        </NotesListModal>
      ) : null}

      {editingNoteId ? (
        <div
          className="staff-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !confirmDeleteNoteId) cancelEditNote();
          }}
        >
          <div
            className="staff-modal family-note-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-note-edit-title"
          >
            <div className="family-list-modal-header">
              <h3 id="staff-note-edit-title">Edit note</h3>
              <StaffIconButton label="Close" title="Cancel" tone="muted" onClick={cancelEditNote}>
                <IconClose size={18} />
              </StaffIconButton>
            </div>
            <dl className="family-note-edit-meta">
              <div>
                <dt>Created By</dt>
                <dd>{editingNote?.authorDisplayName || "—"}</dd>
              </div>
              <div>
                <dt>Created Time</dt>
                <dd>{formatWhen(editingNote?.createdAt)}</dd>
              </div>
              <div>
                <dt>Edited By</dt>
                <dd>{editingNote?.editorDisplayName || "—"}</dd>
              </div>
              <div>
                <dt>Edited Time</dt>
                <dd>{formatWhen(editingNote?.updatedAt)}</dd>
              </div>
            </dl>
            <form
              onSubmit={(event) => void saveNoteEdit(event)}
              className="staff-modal-form family-note-edit-form"
            >
              <label className="family-note-edit-field">
                Note
                <textarea
                  value={noteEditDraft}
                  onChange={(event) => setNoteEditDraft(event.target.value)}
                  rows={5}
                  autoFocus
                />
              </label>
              <div className="staff-modal-actions">
                <button
                  type="button"
                  className="danger-button"
                  disabled={!!deletingNoteId}
                  onClick={() => {
                    if (editingNoteId) setConfirmDeleteNoteId(editingNoteId);
                  }}
                >
                  Delete
                </button>
                <button
                  type="submit"
                  className="action-btn action-btn-edit"
                  disabled={savingNoteEdit || !noteEditDraft.trim()}
                >
                  {savingNoteEdit ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {confirmDeleteNoteId ? (
        <ConfirmDeleteModal
          busy={deletingNoteId === confirmDeleteNoteId}
          onCancel={() => {
            if (!deletingNoteId) setConfirmDeleteNoteId(null);
          }}
          onConfirm={() => void deleteNote(confirmDeleteNoteId)}
        />
      ) : null}
    </>
  );
}
