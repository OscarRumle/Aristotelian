import { useMemo } from "react";
import { collectUnresolvedAcrossWorld } from "../utils/unresolvedMentions.js";

const TYPE_LABELS = {
  character: "Character",
  object:    "Object",
  faction:   "Faction",
  location:  "Location",
  lore:      "Lore",
};

/**
 * World-level "Loose Ends" panel — lists every unresolved [[...]] mention.
 *
 * Props:
 *   world          — current world
 *   onBack         — () => void
 *   onCreate       — ({ entityType, name, sourceText, sourceEntityType, sourceEntityId, sourceFieldKey }) => void
 *   onNavigate     — (entityType, entityId, fieldKey) => void  (jump to a source field)
 */
export function LooseEndsPanel({ world, onBack, onCreate, onNavigate }) {
  const items = useMemo(() => collectUnresolvedAcrossWorld(world), [world]);

  const grouped = useMemo(() => {
    const g = { character: [], object: [], faction: [], location: [], lore: [], unknown: [] };
    for (const it of items) {
      const t = it.typeHint && g[it.typeHint] ? it.typeHint : 'unknown';
      g[t].push(it);
    }
    return g;
  }, [items]);

  const total = items.length;

  return (
    <div className="screen loose-ends-page" style={{ paddingBottom: "5rem" }}>
      <div className="page-head">
        <div className="page-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>← {world.name}</button>
        </div>
        <span className="t-eyebrow">World</span>
        <h1 className="t-heading">Loose Ends</h1>
        <p className="t-body">
          Entities mentioned in prose that don't yet exist. Resolve them to grow the world.
        </p>
      </div>
      <div className="divider" />

      {total === 0 ? (
        <p className="t-body" style={{ marginTop: "1.5rem", color: "var(--muted)" }}>
          Nothing loose. Every mention in this world resolves to an existing entity.
        </p>
      ) : (
        <div className="loose-ends-stack">
          {Object.entries(grouped).map(([type, list]) => {
            if (list.length === 0) return null;
            const label = TYPE_LABELS[type] ?? "Unknown type";
            return (
              <section key={type} className="loose-ends-group">
                <h2 className="loose-ends-group-title">
                  {label}
                  <span className="loose-ends-group-count">{list.length}</span>
                </h2>
                <ul className="loose-ends-list">
                  {list.map((item) => (
                    <li key={`${type}::${item.name}`} className="loose-ends-row">
                      <div className="loose-ends-row-main">
                        <span className="loose-ends-name">{item.name}</span>
                        <span className="loose-ends-mentions">
                          {item.count} mention{item.count > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="loose-ends-sources">
                        {item.sources.slice(0, 3).map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            className="loose-ends-source-link"
                            onClick={() => onNavigate?.(s.entityType, s.entityId, s.fieldKey)}
                            title={`Go to ${s.entityName} → ${s.fieldLabel}`}
                          >
                            {s.entityName} · {s.fieldLabel}
                          </button>
                        ))}
                        {item.sources.length > 3 && (
                          <span className="loose-ends-more">+{item.sources.length - 3} more</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary loose-ends-create"
                        onClick={() => {
                          const first = item.sources[0];
                          // Best-effort sourceText: pull the field text from the first source.
                          const sourceText = lookupFieldText(world, first);
                          onCreate?.({
                            entityType: item.typeHint ?? 'character',
                            name: item.name,
                            sourceText,
                            sourceEntityType: first?.entityType,
                            sourceEntityId: first?.entityId,
                            sourceFieldKey: first?.fieldKey,
                          });
                        }}
                      >
                        Create →
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function lookupFieldText(world, source) {
  if (!source) return '';
  const arr =
    source.entityType === 'character' ? (world.characters ?? [])
    : source.entityType === 'object'  ? (world.objects ?? [])
    : source.entityType === 'faction' ? (world.factions ?? [])
    : source.entityType === 'location' ? (world.locations ?? [])
    : source.entityType === 'lore'    ? (world.documents ?? [])
    : [];
  const entity = arr.find((e) => e.id === source.entityId);
  if (!entity) return '';
  const onGenerated = source.entityType === 'object' || source.entityType === 'faction' || source.entityType === 'location';
  return (onGenerated ? entity.generated?.[source.fieldKey] : entity[source.fieldKey]) ?? '';
}
