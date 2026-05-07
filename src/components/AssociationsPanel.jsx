import { useState } from "react";
import { filterEntities } from "../hooks/useMentionInput.js";
import { RELATION_CATEGORIES, RELATION_LOOKUP, inverseRelation } from "../constants.js";

const TYPE_LABELS = {
  character: "Character",
  faction:   "Faction",
  location:  "Location",
  object:    "Object",
  lore:      "Lore",
};

function resolveAssociation(world, assoc) {
  const kind = assoc.kind;
  const arr =
    kind === "character" ? (world.characters ?? [])
    : kind === "faction"  ? (world.factions ?? [])
    : kind === "location" ? (world.locations ?? [])
    : kind === "object"   ? (world.objects ?? [])
    : kind === "lore"     ? (world.documents ?? [])
    : [];
  const entity = arr.find((e) => e.id === assoc.id);
  if (!entity) return null;
  return { id: entity.id, kind, name: entity.name ?? entity.title ?? "?" };
}

export function AssociationsPanel({ entity, entityType, world, onUpdate, onNavigate, onAfterAdd }) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingEntity, setPendingEntity] = useState(null);
  const [pendingNote, setPendingNote] = useState("");
  const [pendingRelation, setPendingRelation] = useState("");

  const associations = entity.associations ?? [];

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
    const newAssoc = {
      kind: pendingEntity.entityType,
      id: pendingEntity.id,
      note: pendingNote.trim(),
      ...(pendingRelation ? { relation: pendingRelation } : {}),
    };
    onUpdate([...associations, newAssoc]);
    const justAdded = { ...newAssoc, name: pendingEntity.name };
    setPendingEntity(null);
    setPendingNote("");
    setPendingRelation("");
    setSearchQuery("");
    setAdding(false);
    onAfterAdd?.(justAdded);
  }

  function handleRemove(idx) {
    onUpdate(associations.filter((_, i) => i !== idx));
  }

  function handleUpdateNote(idx, note) {
    onUpdate(associations.map((a, i) => i === idx ? { ...a, note } : a));
  }

  function handleUpdateRelation(idx, relation) {
    onUpdate(associations.map((a, i) => {
      if (i !== idx) return a;
      const next = { ...a };
      if (relation) next.relation = relation;
      else delete next.relation;
      return next;
    }));
  }

  function cancelAdding() {
    setAdding(false);
    setPendingEntity(null);
    setPendingNote("");
    setPendingRelation("");
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
                  relation={assoc.relation}
                  onNavigate={onNavigate}
                  onRemove={() => handleRemove(idx)}
                  onNoteChange={(note) => handleUpdateNote(idx, note)}
                  onRelationChange={(rel) => handleUpdateRelation(idx, rel)}
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

              <RelationSelect
                value={pendingRelation}
                onChange={setPendingRelation}
                disabled={!pendingEntity}
              />

              <input
                className="assoc-note-input"
                type="text"
                placeholder="Note (optional)"
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

function RelationSelect({ value, onChange, disabled }) {
  return (
    <select
      className="assoc-relation-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label="Relationship type"
    >
      <option value="">— Relationship (optional)</option>
      {RELATION_CATEGORIES.map((cat) => (
        <optgroup key={cat.id} label={cat.label}>
          {cat.relations.map((rel) => (
            <option key={rel.value} value={rel.value}>{rel.value}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function AssocItem({ info, note, relation, onNavigate, onRemove, onNoteChange, onRelationChange }) {
  const [editingNote, setEditingNote] = useState(false);
  const [draft, setDraft] = useState(note);
  const [editingRel, setEditingRel] = useState(false);

  function commitNote() {
    setEditingNote(false);
    if (draft !== note) onNoteChange(draft);
  }

  return (
    <div className="assoc-item">
      <span className={`assoc-type-badge assoc-type--${info.kind}`}>
        {TYPE_LABELS[info.kind] ?? info.kind}
      </span>
      {editingRel ? (
        <RelationSelect
          value={relation ?? ""}
          onChange={(rel) => { onRelationChange(rel); setEditingRel(false); }}
        />
      ) : relation ? (
        <button
          type="button"
          className="assoc-item-relation"
          onClick={() => setEditingRel(true)}
          title={RELATION_LOOKUP[relation]?.description ?? "Edit relationship"}
        >
          {relation}
        </button>
      ) : (
        <button
          type="button"
          className="assoc-item-relation assoc-item-relation--empty"
          onClick={() => setEditingRel(true)}
          title="Set relationship"
        >
          + relation
        </button>
      )}
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

/**
 * Compute reciprocal associations to display on `entity` — i.e. other entities
 * whose stored association points at `entity` with a relation set. Returns:
 *   [{ kind, id, name, relation, sourceLabel }]
 * where `relation` is the inverse-mapped label as it should read on `entity`.
 */
export function computeReciprocalAssociations(world, entity) {
  if (!world || !entity?.id) return [];
  const out = [];
  const arrays = [
    { kind: "character", arr: world.characters ?? [], nameKey: "name" },
    { kind: "faction",   arr: world.factions ?? [],   nameKey: "name" },
    { kind: "location",  arr: world.locations ?? [],  nameKey: "name" },
    { kind: "object",    arr: world.objects ?? [],    nameKey: "name" },
    { kind: "lore",      arr: world.documents ?? [],  nameKey: "title" },
  ];
  for (const { kind, arr, nameKey } of arrays) {
    for (const e of arr) {
      if (e.id === entity.id) continue;
      for (const a of e.associations ?? []) {
        if (a.id !== entity.id) continue;
        if (!a.relation) continue;
        out.push({
          kind,
          id: e.id,
          name: e[nameKey] ?? "?",
          relation: inverseRelation(a.relation) ?? a.relation,
          sourceRelation: a.relation,
        });
      }
    }
  }
  return out;
}
