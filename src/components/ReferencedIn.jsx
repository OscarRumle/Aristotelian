import { useState } from "react";
import { computeBacklinks, groupBacklinks } from "../utils/backlinks.js";

const TYPE_LABELS = {
  character: 'Characters',
  object: 'Objects',
  faction: 'Factions',
  location: 'Locations',
  lore: 'Documents',
};

const TYPE_ORDER = ['character', 'faction', 'location', 'object', 'lore'];

/**
 * Collapsible "Referenced In" section for entity detail pages.
 *
 * Shows which other entities mention this one in their prose fields.
 * Computed at render time from the world — not stored.
 *
 * Props:
 *   entity     — the entity being viewed (character/object/faction/location/lore doc)
 *   entityType — 'character' | 'object' | 'faction' | 'location' | 'lore'
 *   world      — full world object
 *   onNavigate — (entityType, entityId) => void
 */
export function ReferencedIn({ entity, entityType, world, onNavigate }) {
  const [expanded, setExpanded] = useState(false);

  if (!entity || !world) return null;

  const backlinks = computeBacklinks(world, entity.id);
  if (backlinks.length === 0) return null;

  const grouped = groupBacklinks(backlinks);
  const orderedTypes = TYPE_ORDER.filter((t) => grouped[t]?.length > 0);
  const total = backlinks.length;

  return (
    <div className="referenced-in">
      <button
        type="button"
        className="referenced-in-toggle"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
      >
        <span className="referenced-in-toggle-label">Referenced In</span>
        <span className="referenced-in-toggle-count">{total} {total === 1 ? 'place' : 'places'}</span>
        <span className="referenced-in-toggle-chevron" aria-hidden="true">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div className="referenced-in-body">
          {orderedTypes.map((type) => (
            <div key={type} className="referenced-in-group">
              <span className="referenced-in-group-label">{TYPE_LABELS[type] ?? type}</span>
              <ul className="referenced-in-list">
                {grouped[type].map((bl, i) => (
                  <li key={i} className="referenced-in-item">
                    <button
                      type="button"
                      className="referenced-in-link"
                      onClick={() => onNavigate?.(bl.entityType, bl.entityId, bl.fieldKey)}
                    >
                      {bl.entityName}
                    </button>
                    <span className="referenced-in-field"> — in {bl.fieldLabel}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
