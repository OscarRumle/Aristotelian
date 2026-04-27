import { useState } from "react";
import { filterEntities } from "../hooks/useMentionInput.js";
import { resolveEntity } from "../utils/referenceParser.js";

const TYPE_LABELS = {
  character: "Character",
  faction:   "Faction",
  location:  "Location",
  object:    "Object",
};

function resolveAssociation(world, assoc) {
  // Try resolveEntity by id scan — it resolves by name/typeHint but we have id.
  // So search the relevant array directly.
  const kind = assoc.kind;
  const arr =
    kind === "character" ? (world.characters ?? [])
    : kind === "faction"  ? (world.factions ?? [])
    : kind === "location" ? (world.locations ?? [])
    : kind === "object"   ? (world.objects ?? [])
    : [];
  const entity = arr.find((e) => e.id === assoc.id);
  if (!entity) return null;
  return { id: entity.id, kind, name: entity.name ?? entity.title ?? "?" };
}

export function AssociationsPanel({ entity, entityType, world, onUpdate, onNavigate }) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingEntity, setPendingEntity] = useState(null); // { id, entityType, name }
  const [pendingNote, setPendingNote] = useState("");

  const associations = entity.associations ?? [];

  // Resolve each stored association to get current name
  const resolved = associations
    .map((assoc, idx) => ({ assoc, idx, info: resolveAssociation(world, assoc) }))
    .filter((r) => r.info !== null);

  const searchResults = searchQuery.length > 0
    ? filterEntities(world, searchQuery).filter(
        (r) => r.id !== entity.id && !associations.some((a) => a.id === r.id)
      )
    : [];

  function handleAdd() {
    if (!pendingEntity) return;
    const newAssoc = { kind: pendingEntity.entityType, id: pendingEntity.id, note: pendingNote.trim() };
    onUpdate([...associations, newAssoc]);
    setPendingEntity(null);
    setPendingNote("");
    setSearchQuery("");
    setAdding(false);
  }

  function handleRemove(idx) {
    onUpdate(associations.filter((_, i) => i !== idx));
  }

  function handleUpdateNote(idx, note) {
    onUpdate(associations.map((a, i) => i === idx ? { ...a, note } : a));
  }

  function cancelAdding() {
    setAdding(false);
    setPendingEntity(null);
    setPendingNote("");
    setSearchQuery("");
  }

  return (
    <div className="assoc-panel">
      <button
        type="button"
        className="assoc-panel-toggle"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <span className={`assoc-toggle-icon${open ? " open" : ""}`}>▶</span>
        <span className="assoc-toggle-label">Connections</span>
        {associations.length > 0 && (
          <span className="assoc-count">{associations.length}</span>
        )}
      </button>

      {open && (
        <div className="assoc-body">
          {resolved.length > 0 && (
            <div className="assoc-list">
              {resolved.map(({ assoc, idx, info }) => (
                <AssocItem
                  key={assoc.id + idx}
                  info={info}
                  note={assoc.note}
                  onNavigate={onNavigate}
                  onRemove={() => handleRemove(idx)}
                  onNoteChange={(note) => handleUpdateNote(idx, note)}
                />
              ))}
            </div>
          )}

          {adding ? (
            <div className="assoc-add-form">
              {pendingEntity ? (
                <div className="assoc-add-selected">
                  <span className={`assoc-type-badge assoc-type--${pendingEntity.entityType}`}>
                    {TYPE_LABELS[pendingEntity.entityType] ?? pendingEntity.entityType}
                  </span>
                  <span className="assoc-pending-name">{pendingEntity.name}</span>
                  <button
                    type="button"
                    className="assoc-clear-pending"
                    onClick={() => { setPendingEntity(null); setSearchQuery(""); }}
                    aria-label="Change entity"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="assoc-search-wrap">
                  <input
                    className="assoc-search"
                    type="text"
                    placeholder="Search entities…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searchResults.length > 0 && (
                    <div className="assoc-results">
                      {searchResults.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className="assoc-result-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setPendingEntity(r);
                            setSearchQuery("");
                          }}
                        >
                          <span className="assoc-result-name">{r.name}</span>
                          <span className={`assoc-type-badge assoc-type--${r.entityType}`}>
                            {TYPE_LABELS[r.entityType] ?? r.entityType}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <input
                className="assoc-note-input"
                type="text"
                placeholder="Relationship note (optional) — e.g. born on, leads, allied with"
                value={pendingNote}
                onChange={(e) => setPendingNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && pendingEntity) handleAdd(); }}
                disabled={!pendingEntity}
              />

              <div className="assoc-form-actions">
                <button
                  type="button"
                  className="btn btn-primary assoc-confirm-btn"
                  onClick={handleAdd}
                  disabled={!pendingEntity}
                >
                  Add →
                </button>
                <button type="button" className="btn btn-ghost" onClick={cancelAdding}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="assoc-add-trigger"
              onClick={() => setAdding(true)}
            >
              + Add connection
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AssocItem({ info, note, onNavigate, onRemove, onNoteChange }) {
  const [editingNote, setEditingNote] = useState(false);
  const [draft, setDraft] = useState(note);

  function commitNote() {
    setEditingNote(false);
    if (draft !== note) onNoteChange(draft);
  }

  return (
    <div className="assoc-item">
      <span className={`assoc-type-badge assoc-type--${info.kind}`}>
        {TYPE_LABELS[info.kind] ?? info.kind}
      </span>
      <button
        type="button"
        className="assoc-item-name"
        onClick={() => onNavigate?.(info.kind, info.id)}
      >
        {info.name}
      </button>
      {editingNote ? (
        <input
          className="assoc-note-edit"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitNote}
          onKeyDown={(e) => { if (e.key === 'Enter') commitNote(); if (e.key === 'Escape') { setDraft(note); setEditingNote(false); } }}
          autoFocus
        />
      ) : (
        <button
          type="button"
          className="assoc-item-note"
          onClick={() => { setDraft(note); setEditingNote(true); }}
          title="Click to edit note"
        >
          {note || <span className="assoc-note-empty">add note</span>}
        </button>
      )}
      <button
        type="button"
        className="assoc-item-remove"
        onClick={onRemove}
        aria-label={`Remove connection to ${info.name}`}
      >
        ×
      </button>
    </div>
  );
}
