// Single source of truth for Aristotelian lens framing blocks and the
// lens-aware verb picker. Every prompt builder imports getLensFraming(lens)
// from here — never copy the framing text into individual builders, or it
// will drift. The generating-progress hook and the inline entity progress
// components import pickVerbs(phase, lens) from here.

/**
 * Return the verb array for the given phase, lens-aware.
 * - If lens is set and phase.verbsByLens[lens] exists, use that.
 * - Otherwise fall back to phase.verbs (the default / hamartia set).
 * - Dev-mode console warning when a lens has no entry for a phase, so we
 *   catch coverage gaps while writing verb sets.
 */
export function pickVerbs(phase, lens) {
  if (!phase) return [];
  if (lens && phase.verbsByLens?.[lens]) return phase.verbsByLens[lens];
  if (
    lens &&
    lens !== "hamartia" &&
    phase.verbsByLens &&
    typeof import.meta !== "undefined" &&
    import.meta.env?.DEV
  ) {
    // eslint-disable-next-line no-console
    console.warn(`[lens] No verbsByLens["${lens}"] for phase "${phase.id}" — falling back to default verbs.`);
  }
  return phase.verbs ?? [];
}

//
// Returns the framing string for a known lens, null for lens=null (which
// means "no framing — generate freely"), or falls through to the hamartia
// default for unrecognized values (fail-soft).
export function getLensFraming(lens) {
  switch (lens) {
    case null:
    case undefined:
      return null;

    case "hamartia":
    default:
      return `LENS — HAMARTIA: Generate through the lens of hamartia. The fatal error must emerge from this entity's greatest strength — the same quality operating under different circumstances. Strength and flaw are inseparable. This is not a personality defect; it is a specific error of judgment made from a position of genuine virtue.`;

    case "anagnorisis":
      return `LENS — ANAGNORISIS (RECOGNITION): Generate through the lens of recognition. What does this entity not yet understand about itself? What truth is approaching? What moment of recognition is latent — the move from ignorance to knowledge that, once it arrives, changes everything? Frame every field around this gap. The most important thing about this entity is not what it is, but what it doesn't yet know.`;

    case "peripeteia":
      return `LENS — PERIPETEIA (REVERSAL): Generate through the lens of reversal. What choices or qualities already contain the seeds of their own undoing? The reversal must arise from the entity's own logic, not external accident. The moves made to secure a position must be the moves that undermine it. Frame every field around structural irony: what they are doing to protect themselves is what will destroy them.`;

    case "telos":
      return `LENS — TELOS (DIRECTION): Generate through the lens of final cause. Everything tends somewhere. The question is not what this entity is, but what it is becoming. If nothing changes and no story intervenes, where does this end up? What is already in motion that no one has fully recognized? Frame every field around trajectory, not current state.`;

    case "polis":
      return `LENS — POLIS (SOCIETY): Generate through the lens of the social fabric. This entity is constituted by the community that formed it. What does the world make of it? What virtues does it reward, what does it destroy, what contradictions does it create that the entity cannot resolve? Frame the description around social position, what the community values, and the gap between stated and actual values.`;

    case "world_hamartia":
      return `LENS — WORLD HAMARTIA (STRUCTURAL FLAW): Generate through the lens of systemic tension. This entity embodies or is caught inside an irresolvable contradiction — two legitimate goods in conflict, neither of which can win. This is not a defect; it is a structural tension that cannot be resolved, only managed. What is the central contradiction this entity lives inside?`;

    case "rhetoric":
      return `LENS — RHETORIC (MODES OF PERSUASION): Generate through the lens of Aristotle's Rhetoric. Every character argues from one of three modes: Ethos (authority — "trust me because of who I am"), Pathos (emotion — "feel what I feel"), Logos (logic — "here is the reasoning"). The most revealing moment is which mode they retreat to when losing. Frame the description around how this entity persuades, argues, and communicates under pressure.`;

    case "gap":
      return `LENS — THE GAP (COMIC): Generate through the lens of the comic gap. Comedy = a specific visible deficiency + consequences that stop short of real lasting harm. The gap runs between what this entity believes to be true about itself and what the audience can clearly see is actually true. The gap must be visible to the audience before it is visible to the entity. Never let the entity fully see it — a full recognition closes the gap and ends the comedy. The wrongness must be recognizably human; the audience must want this entity to be okay, even while laughing at it. ONLY use this lens when style is Comic or Mixed.`;
  }
}
