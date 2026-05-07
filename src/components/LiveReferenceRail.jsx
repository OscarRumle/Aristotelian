import { useMemo } from "react";
import { parseReferences, resolveEntity } from "../utils/referenceParser.js";
import { setHoverPreview, clearHoverPreview } from "./EntityHoverPreview.jsx";

const TYPE_LABELS = {
  character: "Characters",
  object:    "Objects",
  faction:   "Factions",
  location:  "Locations",
  lore:      "Lore",
};
const TYPE_ORDER = ["character", "object", "faction", "location", "lore"];

/**
 * Side rail listing every entity referenced in a long-prose surface, grouped
 * by type. Hover surfaces the same EntityHoverPreview as RichText tags.
 *
 * Props:
 *   text       — string (or array of strings) containing [[...]] markup
 *   world      — current world
 *   onNavigate — (entityType, entityId) => void
 *   title      — heading shown at the top of the rail (default "References")
 */
export function LiveReferenceRail({ text, world, onNavigate, title = "References" }) {
  const grouped = useMemo(() => {
    const all = Array.isArray(text) ? text.filter(Boolean).join("\n\n") : (text ?? "");
    if (!all) return {};
    const segs = parseReferences(all);
    const seen = new Map();
    for (const s of segs) {
      if (s.kind !== 'tag') continue;
      const r = resolveEntity(world, { id: s.id, name: s.name, typeHint: s.typeHint });
      if (!r) continue;
      if (seen.has(r.id)) continue;
      seen.set(r.id, r);
    }
    const out = {};
    for (const e of seen.values()) {
      if (!out[e.type]) out[e.type] = [];
      out[e.type].push(e);
    }
    for (const t of Object.keys(out)) {
      out[t].sort((a, b) => a.name.localeCompare(b.name));
    }
    return out;
  }, [text, world]);

  const total = Object.values(grouped).reduce((acc, arr) => acc + arr.length, 0);
  if (total === 0) return null;

  return (
    <aside className="ref-rail" aria-label={title}>
      <div className="ref-rail-head">
        <span className="ref-rail-title">{title}</span>
        <span className="ref-rail-count">{total}</span>
      </div>
      {TYPE_ORDER.map((type) => {
        const list = grouped[type];
        if (!list || list.length === 0) return null;
        return (
          <div key={type} className="ref-rail-group">
            <span className={`ref-rail-group-label ref-rail-group-label--${type}`}>
              {TYPE_LABELS[type]}
            </span>
            <ul className="ref-rail-list">
              {list.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className={`ref-rail-link ref-rail-link--${type}`}
                    onClick={() => { clearHoverPreview(); onNavigate?.(type, e.id); }}
                    onMouseEnter={(ev) => setHoverPreview({ entity: e, anchorRect: ev.currentTarget.getBoundingClientRect() })}
                    onMouseLeave={clearHoverPreview}
                    onFocus={(ev) => setHoverPreview({ entity: e, anchorRect: ev.currentTarget.getBoundingClientRect() })}
                    onBlur={clearHoverPreview}
                  >
                    {e.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </aside>
  );
}
