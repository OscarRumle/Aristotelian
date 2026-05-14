import { LENS_LABELS, LENS_DESCRIPTIONS } from "../constants.js";

// Plain-English description lookup (LENS_DESCRIPTIONS keys are strings, so
// null gets mapped to "none").
function descriptionFor(lens) {
  if (lens == null) return LENS_DESCRIPTIONS.none;
  return LENS_DESCRIPTIONS[lens] ?? "";
}

/**
 * Read-only lens tag for entity detail pages. Hover to see the lens label,
 * its description, and an honest statement of the v1 lock (lens is fixed
 * for this entity; create a new one to try a different lens).
 *
 * Renders nothing when:
 *   - lens is null (the explicit None opt-out — no tag is meaningful)
 *   - lens is an unrecognized value (data drift, manual edit) — fail-soft
 *
 * Props:
 * - lens: the entity's stored lens id (string or null)
 * - entityNoun: e.g. "character", "faction", "location", "object" — used in
 *   the hover tooltip copy
 */
export function LensTag({ lens, entityNoun = "entity" }) {
  if (lens == null) return null;
  const label = LENS_LABELS[lens];
  if (!label) return null;
  const desc = descriptionFor(lens);
  const title = `Generated through ${label}. ${desc} Lens is fixed for this ${entityNoun} — create a new ${entityNoun} to try a different lens.`;
  return (
    <span className="lens-tag" title={title} aria-label={title}>
      {label}
    </span>
  );
}
