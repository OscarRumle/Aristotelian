export const STORAGE_KEY = "aristotelian-worlds-v2";
export const STORAGE_VERSION = 13;

// ── User settings ──────────────────────────────────────────────────────────
// Stored alongside worlds in the storage envelope as `settings`. Empty string
// for a key means "fall back to env on the proxy side" — never seed real
// defaults here, the proxy already knows them.
export const ANTHROPIC_MODEL_OPTIONS = [
  { value: "claude-opus-4-7",            label: "Opus 4.7 — most capable" },
  { value: "claude-sonnet-4-6",          label: "Sonnet 4.6 — balanced (default)" },
  { value: "claude-haiku-4-5-20251001",  label: "Haiku 4.5 — fastest" },
];

export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";

export const DEFAULT_SETTINGS = {
  anthropicKey: "",
  anthropicVersion: "",
  higgsfieldKeyId: "",
  higgsfieldKeySecret: "",
  anthropicModel: "",            // empty = use DEFAULT_ANTHROPIC_MODEL
  defaultAutoGenerateImages: false,
  minPhaseMs: 4000,
  verbCycleMs: 1600,
};

// ── Image generation defaults ──────────────────────────────────────────────
// Per-asset-type style presets used to compose Higgsfield image prompts.
// `subject` is computed per-asset from the asset's own visual fields and is
// intentionally absent here. Every other key is a free-form text field the
// user can edit per-world via ImageStyleSettings.
//
// Field shape kept stable across asset types so a single composer
// (buildImagePrompt) can render any of them. Add new fields by extending
// IMAGE_STYLE_FIELDS below.
export const IMAGE_STYLE_FIELDS = [
  { key: "location",     label: "Location" },
  { key: "year",         label: "Year" },
  { key: "artistStyle",  label: "Artist Style" },
  { key: "gameStyle",    label: "Game art style inspiration" },
  { key: "medium",       label: "Medium" },
  { key: "expression",   label: "Expression" },
  { key: "rendering",    label: "Rendering" },
  { key: "lighting",     label: "Lighting" },
  { key: "color",        label: "Color" },
];

// Per-asset-type label overrides for IMAGE_STYLE_FIELDS. The default label is
// used everywhere except where overridden. Used by buildImagePrompt (the line
// prefix sent to FLUX) and the editor UIs (AssetImage + ImageStyleSettings).
export const IMAGE_STYLE_FIELD_LABEL_OVERRIDES = {
  character: { location: "Background" },
};

export function getImageFieldLabel(type, key) {
  const override = IMAGE_STYLE_FIELD_LABEL_OVERRIDES[type]?.[key];
  if (override) return override;
  const field = IMAGE_STYLE_FIELDS.find((f) => f.key === key);
  return field?.label || key;
}

const SHARED_STYLE_DEFAULTS = {
  location:    "",
  year:        "",
  artistStyle: "Sergey Kolesov",
  gameStyle:   "Dishonored 2",
  medium:      "Stylized Digital Concept Art",
  expression:  "Textures are broad, expressive, and painterly, while maintaining clean, architectural silhouettes.",
  rendering:   "faces, bodies, and fabrics rendered with sharp, angular, geometric facets rather than smooth curves",
  lighting:    "Cinematic Atmospheric, High Contrast shadows",
  color:       "Slightly desaturated color scheme",
};

export const IMAGE_STYLE_DEFAULTS = {
  character: { ...SHARED_STYLE_DEFAULTS, location: "solid color #F4EDE4", year: "1992" },
  object:    { ...SHARED_STYLE_DEFAULTS, location: "still-life staging on weathered wood", year: "" },
  location:  { ...SHARED_STYLE_DEFAULTS, location: "", year: "" },
  faction:   { ...SHARED_STYLE_DEFAULTS, location: "emblematic group portrait or insignia", year: "" },
};

export const IMAGE_ASPECT_RATIOS = {
  character: "3:4",
  object:    "3:4",
  location:  "16:9",
  faction:   "1:1",
};

// Higgsfield model endpoint per asset type. Path is appended to
// https://platform.higgsfield.ai/ (via /api/higgsfield proxy) so we use
// slash-separated slugs without a leading slash.
//
// Default: FLUX.2 MAX. Endpoint slug verified by probing 2026-05-07.
// Known fallback: "flux-pro/kontext/max/text-to-image" (FLUX.1 Pro Kontext Max).
export const IMAGE_MODEL_DEFAULT = "flux-2-max";

export const IMAGE_MODELS = {
  character: IMAGE_MODEL_DEFAULT,
  object:    IMAGE_MODEL_DEFAULT,
  location:  IMAGE_MODEL_DEFAULT,
  faction:   IMAGE_MODEL_DEFAULT,
};

// ── Relationship taxonomy for associations ─────────────────────────────────
// Each entry: { value, label, inverse, description }
// `inverse` is the label that should display on the *other* entity when this
// relation is set. Symmetric relations have inverse === value.
// Used by AssociationsPanel selector and reciprocal-display logic.
export const RELATION_CATEGORIES = [
  {
    id: "social",
    label: "Social",
    description: "Relationships, bonds, emotions",
    relations: [
      { value: "Ally",         inverse: "Ally",          description: "Shared goals, mutual support" },
      { value: "Rival",        inverse: "Rival",         description: "Competition, opposition" },
      { value: "Family",       inverse: "Family",        description: "Blood, marriage, kinship" },
      { value: "Love",         inverse: "Love",          description: "Romance, desire, attraction" },
      { value: "Mentor",       inverse: "Student of",    description: "Teacher → student" },
      { value: "Student of",   inverse: "Mentor",        description: "Student → teacher" },
      { value: "Betrayed by",  inverse: "Betrayed",      description: "Trust broken, wounded" },
      { value: "Oath-bound",   inverse: "Oath-bound",    description: "Sworn, contract, binding promise" },
    ],
  },
  {
    id: "historical",
    label: "Historical",
    description: "Lineage, events, causality",
    relations: [
      { value: "Trained by",      inverse: "Trainer of",   description: "Student of, learned from" },
      { value: "Caused",          inverse: "Caused by",    description: "Other entity is consequence of this one" },
      { value: "Witnessed",       inverse: "Witnessed by", description: "Was present for, saw happen" },
      { value: "Descended from",  inverse: "Ancestor of",  description: "Bloodline, inheritance" },
      { value: "Built by",        inverse: "Builder of",   description: "Created, crafted, constructed" },
      { value: "Destroyed",       inverse: "Destroyed by", description: "Ruined, ended, unmade" },
      { value: "Prophesied",      inverse: "Prophesied by",description: "Fated, destined, foretold" },
    ],
  },
  {
    id: "physical",
    label: "Physical",
    description: "Ownership, containment, location",
    relations: [
      { value: "Contains",     inverse: "Contained in", description: "Inside, held by, houses" },
      { value: "Owned by",     inverse: "Owner of",     description: "Possession, property" },
      { value: "Located in",   inverse: "Location of",  description: "At, situated within" },
      { value: "Made from",    inverse: "Material of",  description: "Material, substance" },
      { value: "Guarded by",   inverse: "Guardian of",  description: "Protected, defended" },
    ],
  },
  {
    id: "mystical",
    label: "Mystical",
    description: "Curses, blessings, fate",
    relations: [
      { value: "Cursed by",    inverse: "Curse on",     description: "Afflicted, hexed, bound" },
      { value: "Blessed by",   inverse: "Blessing on",  description: "Favored, protected, enhanced" },
      { value: "Bound to",     inverse: "Bound to",     description: "Linked, tethered, entwined" },
      { value: "Haunted by",   inverse: "Haunts",       description: "Visited, observed by spirit" },
      { value: "Empowered by", inverse: "Empowers",     description: "Given strength, magic, ability" },
    ],
  },
];

// Flat lookup: relation value → { category, inverse, description }.
export const RELATION_LOOKUP = (() => {
  const out = {};
  for (const cat of RELATION_CATEGORIES) {
    for (const rel of cat.relations) {
      out[rel.value] = { category: cat.id, categoryLabel: cat.label, inverse: rel.inverse, description: rel.description };
    }
  }
  return out;
})();

export function inverseRelation(value) {
  return RELATION_LOOKUP[value]?.inverse ?? null;
}

// ── Relationship Web connection types ──────────────────────────────────────
// Hamartia-driven Aristotelian framings for the Relationship Web. Intentionally
// separate from RELATION_CATEGORIES above — these describe *dramatic forces*
// between two characters, not the social/historical/physical/mystical
// taxonomy used elsewhere. Color tokens are defined in styles.css.
export const RELATIONSHIP_TYPES = [
  { id: "conflict",   label: "Conflict",   description: "Their natures cannot coexist",            directional: false, colorVar: "--rw-conflict" },
  { id: "dependency", label: "Dependency", description: "One's weakness is the other's power",     directional: true,  colorVar: "--rw-dependency" },
  { id: "loyalty",    label: "Loyalty",    description: "A bond the story will test",              directional: false, colorVar: "--rw-loyalty" },
  { id: "mirror",     label: "Mirror",     description: "The same flaw, different masks",          directional: false, colorVar: "--rw-mirror" },
  { id: "debt",       label: "Debt",       description: "An obligation that shapes every scene",   directional: true,  colorVar: "--rw-debt" },
  { id: "catalyst",   label: "Catalyst",   description: "One triggers the other's fall",           directional: true,  colorVar: "--rw-catalyst" },
  { id: "custom",     label: "Custom",     description: "Write your own connection",               directional: false, colorVar: "--rw-custom" },
];

export const RELATIONSHIP_TYPES_BY_ID = Object.fromEntries(RELATIONSHIP_TYPES.map((t) => [t.id, t]));

export const CHAR_COLORS = [
  "#C87941",
  "#5B8A6E",
  "#7B6FAB",
  "#B05E6F",
  "#4A7FA5",
  "#A07850",
  "#5A8A8A",
  "#8A6A5A",
];

export const MOOD_OPTIONS = [
  { value: "Tense", label: "Tense" },
  { value: "Playful", label: "Playful" },
  { value: "Aftermath", label: "Aftermath" },
  { value: "First Meeting", label: "First Meeting" },
];

export const MIN_PHASE_MS = 4000;

// streamMarker: when this string appears in the streaming JSON, the phase content is done
export const PHASES = [
  {
    id: "identity",
    label: "Identity",
    streamMarker: '"summary"',
    verbs: [
      "Choosing a name…",
      "Picking the face…",
      "Finding the features…",
      "Sketching the silhouette…",
      "Placing them in the world…",
      "Giving them a body…",
      "Deciding who they are…",
      "Setting the scene…",
    ],
  },
  {
    id: "history",
    label: "History",
    streamMarker: '"personality"',
    verbs: [
      "Digging through the past…",
      "Finding the wound…",
      "Counting the years…",
      "Tracing the scars…",
      "Reading the record…",
      "Laying the groundwork…",
      "Following the trail back…",
      "Excavating the damage…",
    ],
    verbsByLens: {
      anagnorisis: ["Finding what they refuse to look at…", "Tracing the blind spot back…", "Locating the thing unseen…", "Reading what's hidden from themselves…"],
      peripeteia:  ["Tracing the move that will undo them…", "Finding the seed of the reversal…", "Reading the irony backward…", "Following the choice that breaks them…"],
      telos:       ["Reading the trajectory…", "Finding where this is heading…", "Following the momentum…", "Tracing the slope downward…"],
      polis:       ["Reading the world that made them…", "Tracing the social weight…", "Finding what was given and what was taken…", "Hearing what the city said about them…"],
      rhetoric:    ["Listening for the mode…", "Finding what they argue from…", "Hearing the retreat under pressure…", "Tracing the persuasion…"],
      gap:         ["Finding the wrongness they can't see…", "Measuring the gap…", "Locating the misunderstanding…", "Tracing the unaware…"],
      world_hamartia: ["Locating the contradiction they live inside…", "Finding the irresolvable tension…", "Reading what cannot coexist…", "Following the strain of two truths…"],
    },
  },
  {
    id: "psychology",
    label: "Psychology",
    streamMarker: '"moralCore"',
    verbs: [
      "Mapping the desires…",
      "Weighing the fears…",
      "Reading the cracks…",
      "Probing the damage…",
      "Measuring the want…",
      "Finding what keeps them up at night…",
      "Locating the obsession…",
      "Charting the need…",
    ],
    verbsByLens: {
      anagnorisis: ["Locating what they don't yet know…", "Mapping the recognition to come…", "Finding the truth approaching…", "Hearing the knock at the door…"],
      peripeteia:  ["Tracing how the same move becomes the wound…", "Reading the structural irony…", "Following the logic of undoing…", "Finding the choice that turns…"],
      telos:       ["Reading where the desires lead…", "Following the trajectory of want…", "Finding what they're becoming…", "Tracing the arc forward…"],
      polis:       ["Reading what the world rewards in them…", "Finding what was made of them…", "Tracing the contradiction the world creates…", "Hearing what they were trained to want…"],
      rhetoric:    ["Finding what mode they trust…", "Reading who they argue against in their own head…", "Hearing the inner persuasion…", "Locating the retreat under pressure…"],
      gap:         ["Reading the gap between belief and truth…", "Finding what the audience already knows…", "Measuring the wrongness…", "Locating the affectionate misread…"],
      world_hamartia: ["Reading the tension they cannot resolve…", "Finding which good they're forced to betray…", "Tracing the irresolvable choice…", "Measuring the cost of either path…"],
    },
  },
  {
    id: "core",
    label: "Aristotelian Core",
    streamMarker: '"speechMode"',
    verbs: [
      "Consulting the Greeks…",
      "Finding the hamartia…",
      "Naming the flaw…",
      "Weighing the virtue…",
      "Measuring the grief…",
      "Reading the omens…",
      "Counting the debts…",
      "Locating the tragedy…",
      "Sharpening the edges…",
      "Identifying the downfall…",
    ],
    verbsByLens: {
      anagnorisis: ["Naming what they don't yet see…", "Finding the recognition latent in the story…", "Locating the moment of seeing…", "Weighing the truth approaching…"],
      peripeteia:  ["Naming the reversal in them…", "Finding the seed of their own undoing…", "Tracing the structural irony…", "Identifying the move that turns…"],
      telos:       ["Reading the final cause…", "Finding what this is becoming…", "Naming the trajectory…", "Locating the destination already in motion…"],
      polis:       ["Naming what the world made of them…", "Finding the social contradiction…", "Reading what the city rewards and destroys…", "Locating the unstated rules…"],
      rhetoric:    ["Listening for ethos, pathos, logos…", "Finding their mode of argument…", "Naming what they retreat to under pressure…", "Hearing the rhetoric they trust…"],
      gap:         ["Finding the comic deficiency…", "Naming the gap…", "Measuring the affectionate wrongness…", "Locating what they can't see about themselves…"],
      world_hamartia: ["Naming the structural tension…", "Finding the two goods that can't coexist…", "Locating the world's irresolvable flaw…", "Reading what can only be managed…"],
    },
  },
  {
    id: "dialogue",
    label: "Dialogue",
    streamMarker: '"aristotelianNote"',
    verbs: [
      "Tuning the voice…",
      "Learning the lies…",
      "Finding the evasions…",
      "Sharpening the tongue…",
      "Hearing the silence…",
      "Practicing the deflections…",
      "Choosing what goes unsaid…",
      "Calibrating the subtext…",
    ],
    verbsByLens: {
      anagnorisis: ["Hearing what they cannot yet say…", "Listening for the unspoken truth…", "Finding the silence that knows…", "Calibrating the approach of recognition…"],
      peripeteia:  ["Tuning the voice that will betray them…", "Finding the line that turns…", "Hearing the irony in the speech…", "Calibrating the words that undo…"],
      telos:       ["Listening for where the voice is heading…", "Hearing the rhetoric of becoming…", "Tuning toward the trajectory…", "Calibrating what they're growing into saying…"],
      polis:       ["Hearing what the city taught them to say…", "Listening for the social inheritance…", "Tuning the inherited tongue…", "Calibrating the public mask…"],
      rhetoric:    ["Tuning for ethos, pathos, logos…", "Hearing what they argue from…", "Calibrating the mode of persuasion…", "Listening for the retreat under pressure…"],
      gap:         ["Tuning the voice that doesn't hear itself…", "Hearing the comic mis-knowing…", "Finding the unwitting line…", "Calibrating the affectionate gap…"],
      world_hamartia: ["Tuning a voice caught between two goods…", "Hearing the strain of irresolvable speech…", "Calibrating the contradiction…", "Listening for what the tension makes them say…"],
    },
  },
  {
    id: "finishing",
    label: "Finishing",
    streamMarker: null,
    verbs: [
      "Summoning the soul…",
      "Finishing the portrait…",
      "One last look…",
      "Bringing it all together…",
      "Almost there…",
      "Final touches…",
      "Signing the work…",
    ],
  },
];

export const PHIL = {
  appearance:
    "Likeness to truth: even in extraordinary worlds, characters must remain recognizably human. Physical details are not decoration — they are the body that carries the soul.",
  personality:
    "Appropriateness: their traits must feel earned and contextually grounded. Behaviors and values must be plausible given their background, role, and world.",
  desires:
    "Surface goal. What the character thinks they want. This may not be what they actually need — that tension is often the story.",
  fears:
    "What they avoid. What haunts them. Fear is what makes choices cost something — and without cost, there is no character.",
  moralCore:
    "Character is not what a person thinks or feels in private. Character is what a person does under pressure. What would they protect even at cost? It doesn't need to be admirable — it needs to exist.",
  hamartia:
    "Not a flaw. A specific error that emerges from their greatest strength. The best quality and the worst mistake are the same thing in different circumstances. Oedipus's relentless curiosity makes him a great king — and destroys him.",
  consistency:
    "A character's behavior must follow a logic. State it in one sentence. A character who is consistently unpredictable is still consistent — the audience learns to anticipate the unpredictability.",
  speechMode:
    "Aristotle's Rhetoric identifies three modes of persuasion: Ethos (authority/credibility — 'trust me because of who I am'), Pathos (emotion — 'feel what I feel'), Logos (logic — 'here is the reasoning'). The most revealing moment: which mode does this character retreat to when losing?",
  underPressure:
    "Character is revealed under pressure, not in comfort. A conversation where nothing is at stake is not a dramatic scene. What does this character actually do when cornered?",
  subtext:
    "The true thing said directly is dianoia — it tells the audience what the character thinks. The true thing visible beneath what the character says is ethos — it shows who they are. What does this character always talk around but never at?",
  voicePattern:
    "A character's voice is not style. It is the sound of their specific configuration of values, fears, and habits under pressure. Get the character right, and the voice follows.",
};

export const ROLE_OPTIONS = [
  { value: "Lead", label: "Lead", desc: "Drives the central reversal" },
  { value: "Deuteragonist", label: "Deuteragonist", desc: "Second engine, interlocked hamartia" },
  { value: "Supporting", label: "Supporting", desc: "Reveals the lead, no full arc" },
  { value: "Minor", label: "Minor", desc: "Makes specific moments possible" },
  { value: "Ensemble", label: "Ensemble", desc: "Shares the protagonist function" },
];

export const STYLE_OPTIONS = [
  { value: "Tragic", label: "Tragic", desc: "Error is irreversible" },
  { value: "Comic", label: "Comic", desc: "Flaw costs nothing serious" },
  { value: "Mixed", label: "Mixed", desc: "Comic surface, tragic core" },
];

export const DEFAULT_WORLD_NAME = "Broken State";

export const DEFAULT_WORLD_INSPIRATION = "Civil War (Alex Garland) · The Gentlemen (Ritchie) · Barry · No Country for Old Men · Fargo · True Detective S1 · Banshee · Grand Theft Auto · Cyberpunk 2077";

export const DEFAULT_WORLD_DESC = `America, 1991 — but not the one that happened. Twenty-two years ago the federal government collapsed. The two-party system didn't break — it dissolved. What replaced it wasn't revolution. It was a slow, quiet unraveling.

A civil war is technically still active, but most people have stopped paying attention. The political class persists — committees, manifestos, press releases — but with no tax base and no enforcement, it's theater. An intellectual hobby for people who can afford one.

Power lives elsewhere. In gangs, which are racially and culturally exclusive by design — Haitian networks in Florida and New York, Italian syndicates in the northeast, Korean operators on the west coast, Black organizations with deep roots in the south and midwest. Each with their own codes, aesthetics, economies, and territory. Some work both sides of the law — or rather, there is no law, so the distinction barely registers.

Then there are the independents: hackers, private detectives, hitmen, scientists, fixers, garbage collectors who double as informants. People who carved out a function and protect it.

And then there are civilians — about 85% of the country. They work, raise families, navigate the world without allegiances. Most of them just want to be left alone.

Gasoline is rare. Cars are a luxury. The country is quieter than it's been in a century. Nature has come back — overgrown highways, ivy on storefronts, deer in suburbs. There's a strange beauty to the decay.

Every state has its own texture. Texas is its own republic in all but name. New York is a city-state run by competing organizations. California is fragmented into coastal enclaves and inland territory. Minnesota is cold, Lutheran, and deeply suspicious of outsiders. New Mexico is old violence and new money.

Violence here is not heroic. It is mundane, specific, and has consequences that last. People make choices that seem rational in the moment and catastrophic in retrospect. Fate operates with dark, almost comedic precision — the wrong person sees the wrong thing at the wrong time, and everything unravels from there.

This is not a world without hope. It's a world where the old systems failed and something new is growing in the wreckage — not better, necessarily, but real.`;

export const PLACEHOLDER_DESC = DEFAULT_WORLD_DESC;

export const GENRE_OPTIONS = [
  { value: "Fantasy", label: "Fantasy" },
  { value: "Sci-Fi", label: "Sci-Fi" },
  { value: "Historical", label: "Historical" },
  { value: "Contemporary", label: "Contemporary" },
  { value: "Horror", label: "Horror" },
  { value: "Mixed", label: "Mixed" },
];

export const SCALE_OPTIONS = [
  { value: "City", label: "A city" },
  { value: "Nation", label: "A nation" },
  { value: "World", label: "A world" },
  { value: "Cosmos", label: "A cosmos" },
];

export const OBJECT_TYPES = [
  "Weapon",
  "Artifact",
  "Garment/Regalia",
  "Document",
  "Symbol",
  "Structure",
  "Custom",
];

export const RARITY_OPTIONS = ["Common", "Rare", "Unique", "Legendary"];
export const ERA_OPTIONS = ["Ancient", "Historical", "Contemporary", "Recent"];
export const CONDITION_OPTIONS = ["Pristine", "Worn", "Damaged", "Destroyed", "Lost"];

export const OBJECT_TYPE_FIELDS = {
  Weapon: [
    { key: "form",  label: "Form",  opts: ["Blade", "Ranged", "Blunt", "Polearm", "Magical"] },
    { key: "scale", label: "Scale", opts: ["Personal", "Ceremonial", "War"] },
  ],
  Artifact: [
    { key: "origin", label: "Origin", opts: ["Crafted", "Natural", "Divine", "Unknown"] },
    { key: "nature", label: "Nature", opts: ["Mundane", "Enchanted", "Cursed"] },
  ],
  "Garment/Regalia": [
    { key: "kind",    label: "Kind",    opts: ["Armor", "Robe", "Crown", "Seal", "Jewelry", "Standard"] },
    { key: "context", label: "Context", opts: ["Everyday", "Ceremonial", "Battle"] },
  ],
  Document: [
    { key: "form",    label: "Form",    opts: ["Letter", "Map", "Contract", "Prophecy", "Tome", "Decree"] },
    { key: "secrecy", label: "Secrecy", opts: ["Public", "Private", "Secret", "Forbidden"] },
  ],
  Symbol: [
    { key: "form",  label: "Form",        opts: ["Sigil", "Seal", "Banner", "Mark", "Crest"] },
    { key: "affil", label: "Affiliation", opts: ["Character", "Faction", "Religion", "Place"] },
  ],
  Structure: [
    { key: "kind",   label: "Kind",   opts: ["Tower", "Ruin", "Chamber", "Settlement", "Shrine"] },
    { key: "status", label: "Status", opts: ["Standing", "Ruined", "Abandoned", "Lost"] },
  ],
};

export const OBJECT_PHASES = [
  {
    id: "describing",
    streamMarker: '"provenance"',
    verbs: [
      "Naming the thing…",
      "Giving it a form…",
      "Finding the right material…",
      "Sketching the object…",
      "Placing it in the world…",
    ],
  },
  {
    id: "contextualising",
    streamMarker: '"dramatic_weight"',
    verbs: [
      "Reading the history…",
      "Tracing the ownership…",
      "Following the object through time…",
      "Weighing its significance…",
    ],
    verbsByLens: {
      anagnorisis: ["Finding what this object holds and doesn't know it holds…", "Locating the truth hidden inside it…", "Reading the secret in the material…", "Tracing the unspoken weight…"],
      peripeteia:  ["Tracing how this becomes the instrument of its own undoing…", "Reading the irony in the object's use…", "Finding the reversal it carries…", "Following the turn back on itself…"],
      telos:       ["Reading where this object is heading…", "Tracing what it becomes…", "Following its trajectory through hands…", "Finding the end it's tending toward…"],
      polis:       ["Reading what the society makes of this…", "Tracing the social power it carries…", "Finding what the city does with it…", "Hearing what owning this means…"],
      hamartia:    ["Finding the flaw inside its strength…", "Tracing the virtue that wounds…", "Reading the same edge that protects and undoes…", "Locating the gift that betrays…"],
      world_hamartia: ["Locating the contradiction this object embodies…", "Finding the irresolvable tension it carries…", "Reading the two goods at war inside it…", "Tracing what cannot be reconciled…"],
    },
  },
  {
    id: "finishing",
    streamMarker: null,
    verbs: [
      "Almost there…",
      "Final touches…",
      "Sealing the provenance…",
      "Finishing the record…",
    ],
  },
];

// ── Faction constants ──────────────────────────────────────────────────────

export const FACTION_TYPES = [
  "Noble House",
  "Guild",
  "Military Order",
  "Religious/Cult",
  "Political",
  "Criminal/Underground",
  "Secret Society",
  "Rebel/Revolutionary",
  "Custom",
];

export const FACTION_SIZE_OPTIONS   = ["Cell (a handful)", "Small (dozens)", "Established (hundreds)", "Vast (thousands+)"];
export const FACTION_STATUS_OPTIONS = ["Rising", "Stable", "Declining", "Fractured", "Secret", "Disbanded"];
export const FACTION_AGE_OPTIONS    = ["Ancient", "Old", "Established", "Recent", "New"];

export const FACTION_TYPE_FIELDS = {
  "Noble House": [
    { key: "seat",      label: "Seat",      opts: ["Capital", "Provincial", "Frontier", "Exiled"] },
    { key: "standing",  label: "Standing",  opts: ["Ruling", "Noble", "Minor", "Fallen"] },
  ],
  "Guild": [
    { key: "trade", label: "Trade", opts: ["Merchant", "Craft", "Information", "Magic", "Labour"] },
    { key: "reach", label: "Reach", opts: ["Local", "Regional", "Empire-wide"] },
  ],
  "Military Order": [
    { key: "loyalty",    label: "Loyalty",    opts: ["Crown", "Independent", "Mercenary", "Church"] },
    { key: "speciality", label: "Speciality", opts: ["Infantry", "Cavalry", "Naval", "Arcane", "Assassins"] },
  ],
  "Religious/Cult": [
    { key: "practice",  label: "Practice",  opts: ["Public worship", "Mystery cult", "Forbidden", "Heretical"] },
    { key: "orthodoxy", label: "Orthodoxy", opts: ["Mainstream", "Reformed", "Splinter", "Outlawed"] },
  ],
  "Political": [
    { key: "allegiance", label: "Allegiance", opts: ["Throne", "Reform", "Independence", "Oligarchy"] },
    { key: "method",     label: "Method",     opts: ["Diplomacy", "Intrigue", "Propaganda", "Force"] },
  ],
  "Criminal/Underground": [
    { key: "territory", label: "Territory", opts: ["City-wide", "Regional", "Cross-border", "Nomadic"] },
    { key: "trade",     label: "Trade",     opts: ["Smuggling", "Information", "Assassination", "Extortion"] },
  ],
  "Secret Society": [
    { key: "visibility", label: "Visibility", opts: ["Open secret", "Rumoured", "Truly hidden"] },
    { key: "goal",       label: "Goal",       opts: ["Known", "Partially known", "Unknown"] },
  ],
  "Rebel/Revolutionary": [
    { key: "cause",   label: "Cause",   opts: ["Political", "Religious", "Economic", "Ethnic", "Ideological"] },
    { key: "tactics", label: "Tactics", opts: ["Guerrilla", "Propaganda", "Assassination", "Open warfare"] },
  ],
};

export const FACTION_PHASES = [
  {
    id: "describing",
    streamMarker: '"history"',
    verbs: [
      "Naming the faction…",
      "Sketching the organisation…",
      "Finding the structure…",
      "Placing them in the world…",
    ],
  },
  {
    id: "contextualising",
    streamMarker: '"dramatic_role"',
    verbs: [
      "Reading the history…",
      "Tracing the rivalries…",
      "Following the power…",
      "Weighing their influence…",
    ],
    verbsByLens: {
      anagnorisis: ["Finding what this faction doesn't yet see about itself…", "Tracing the truth hidden in their ranks…", "Locating the recognition latent in their story…", "Reading what they refuse to know…"],
      peripeteia:  ["Tracing how their strength becomes their undoing…", "Finding the move that turns the faction against itself…", "Reading the structural irony in their power…", "Following the seed of internal reversal…"],
      telos:       ["Reading where this faction is heading…", "Tracing the trajectory of power…", "Finding what this is becoming…", "Following the momentum forward…"],
      polis:       ["Reading the social fabric they live inside…", "Tracing what the city makes of them…", "Finding the power they hold and the power they fear…", "Hearing who is excluded by this organisation…"],
      hamartia:    ["Finding the flaw inside their strength…", "Tracing the virtue that wounds the faction…", "Reading the same edge that protects and undoes…", "Locating the principle that betrays them…"],
      world_hamartia: ["Locating the irresolvable tension inside the faction…", "Finding two goods at war within them…", "Reading what they manage but cannot resolve…", "Tracing the contradiction they embody…"],
    },
  },
  {
    id: "finishing",
    streamMarker: null,
    verbs: [
      "Almost there…",
      "Final touches…",
      "Finding the contradiction…",
      "Finishing the record…",
    ],
  },
];

// ── Location constants ─────────────────────────────────────────────────────

export const LOCATION_TYPES = [
  "Settlement",
  "Structure",
  "Landscape",
  "Region",
  "Ruin",
  "Hidden/Secret",
  "Custom",
];

export const LOCATION_SCALE_OPTIONS  = ["Room or chamber", "Building", "District or landmark", "Settlement", "Region", "Vast territory"];
export const LOCATION_STATUS_OPTIONS = ["Thriving", "Struggling", "Abandoned", "Ruined", "Mythic", "Unknown"];
export const LOCATION_ACCESS_OPTIONS = ["Open", "Restricted", "Guarded", "Secret", "Lost"];

export const LOCATION_TYPE_FIELDS = {
  "Settlement": [
    { key: "size",       label: "Size",       opts: ["Hamlet", "Town", "City", "Capital", "Sprawling"] },
    { key: "governance", label: "Governance", opts: ["Monarchy", "Republic", "Guild-run", "Theocracy", "Lawless"] },
  ],
  "Structure": [
    { key: "purpose",   label: "Purpose",   opts: ["Military", "Religious", "Civic", "Private", "Arcane"] },
    { key: "condition", label: "Condition", opts: ["Intact", "Damaged", "Derelict", "Ruined"] },
  ],
  "Landscape": [
    { key: "terrain", label: "Terrain", opts: ["Forest", "Mountain", "Coast", "Wetland", "Desert", "Plains", "Underground"] },
    { key: "danger",  label: "Danger",  opts: ["Safe", "Hazardous", "Deadly", "Unknown"] },
  ],
  "Region": [
    { key: "climate",  label: "Climate",  opts: ["Temperate", "Arid", "Arctic", "Tropical", "Blighted"] },
    { key: "control",  label: "Control",  opts: ["Unified", "Contested", "Fractured", "Ungoverned"] },
  ],
  "Ruin": [
    { key: "was",  label: "What it was",  opts: ["City", "Fortress", "Temple", "Estate", "Settlement"] },
    { key: "fall", label: "Cause of fall", opts: ["War", "Disaster", "Plague", "Abandonment", "Unknown"] },
  ],
  "Hidden/Secret": [
    { key: "concealment", label: "Concealment", opts: ["Physically hidden", "Magically hidden", "Unknown to most", "Known but unreachable"] },
    { key: "who_knows",   label: "Who knows",   opts: ["One person", "A few", "A faction", "A legend"] },
  ],
};

export const LOCATION_PHASES = [
  {
    id: "describing",
    streamMarker: '"history"',
    verbs: [
      "Mapping the place…",
      "Sketching the landscape…",
      "Finding the atmosphere…",
      "Placing it in the world…",
    ],
  },
  {
    id: "contextualising",
    streamMarker: '"dramatic_role"',
    verbs: [
      "Reading the history…",
      "Tracing what happened here…",
      "Following the memory…",
      "Weighing its significance…",
    ],
    verbsByLens: {
      anagnorisis: ["Locating what this place still hides…", "Reading the secret in the stones…", "Finding the truth this site doesn't yet release…", "Tracing the recognition waiting to land here…"],
      peripeteia:  ["Finding the place's structural irony…", "Tracing how this site undoes its own purpose…", "Reading the reversal written into the ground…", "Following the turn the location forces…"],
      telos:       ["Reading where this place is heading…", "Tracing the trajectory of the ground…", "Finding what this site is becoming…", "Following the slope toward what comes next…"],
      polis:       ["Reading what the city makes of this place…", "Tracing the social meaning of this ground…", "Finding who is welcomed and who is excluded here…", "Hearing what the community says this site is for…"],
      world_hamartia: ["Locating the irresolvable tension in this place…", "Finding the two goods at war on this ground…", "Reading the contradiction the site embodies…", "Tracing what cannot be reconciled here…"],
    },
  },
  {
    id: "finishing",
    streamMarker: null,
    verbs: [
      "Almost there…",
      "Final touches…",
      "Finding the right line…",
      "Finishing the record…",
    ],
  },
];

// ── Aristotelian Lens System ──────────────────────────────────────────────
// Cross-cutting parameter on every LLM-generated entity. See
// docs/design/aristotelian_lens_system.md for the full spec.

export const DEFAULT_LENS = "hamartia";

// All lenses, ordered as they appear in spec docs (display ordering is
// per-tool via PER_TOOL_LENSES below).
export const LENS_OPTIONS = [
  { value: "hamartia",        label: "Hamartia",       desc: "Flaw from strength — default" },
  { value: "anagnorisis",     label: "Recognition",    desc: "What it doesn't yet know" },
  { value: "peripeteia",      label: "Reversal",       desc: "Seeds of undoing" },
  { value: "telos",           label: "Direction",      desc: "What it's tending toward" },
  { value: "polis",           label: "Society",        desc: "Product of its world" },
  { value: "world_hamartia",  label: "World flaw",     desc: "Structural contradiction" },
  { value: "rhetoric",        label: "Rhetoric",       desc: "How it argues under pressure" },
  { value: "gap",             label: "Comic gap",      desc: "What it can't see about itself" },
  { value: null,              label: "None",           desc: "No framework. Generate freely." },
];

// Quick lookup from lens value → label. Returns undefined for unknown values
// (fail-soft for the detail-page tag, which omits itself in that case).
export const LENS_LABELS = Object.fromEntries(
  LENS_OPTIONS.map((l) => [l.value, l.label])
);

// Plain-English user-facing descriptions. Soft cap: 20 words each so the
// description line never wraps to three lines on narrow screens.
export const LENS_DESCRIPTIONS = {
  hamartia:       "Generates from the idea that your character's greatest quality is also what will destroy them.",
  anagnorisis:    "Generates around what your character doesn't yet understand — and what happens when they finally do.",
  peripeteia:     "Generates around the structural irony: the choices they're making to protect themselves will undo them.",
  telos:          "Generates around where this is heading — not what it is now, but what it's becoming.",
  polis:          "Generates from the social world that shaped this entity — what made it, what it can't escape.",
  world_hamartia: "Generates from an irresolvable contradiction — two things that are both true and can't both win.",
  rhetoric:       "Generates from how this character argues — what mode they use, and what they retreat to when losing.",
  gap:            "Generates from the gap between what this character believes about themselves and what everyone else sees.",
  // null lens: same lookup pattern via a string key (since object keys are strings)
  none:           "No framework. Generate without an Aristotelian angle.",
};

// Per-tool relevance ordering. Default first, conditional/rare options later,
// None last as the explicit opt-out. The `gap` lens on the character row is
// conditionally rendered based on style (Comic / Mixed only).
export const PER_TOOL_LENSES = {
  character: ["hamartia", "anagnorisis", "peripeteia", "rhetoric", "telos", "polis", "gap", null],
  faction:   ["polis", "world_hamartia", "telos", "peripeteia", "hamartia", null],
  location:  ["world_hamartia", "telos", "anagnorisis", "peripeteia", "polis", null],
  object:    ["hamartia", "telos", "anagnorisis", "peripeteia", "polis", null],
  dialogue:  ["hamartia", "rhetoric", "anagnorisis", null],
};

// LocalStorage keys for lens-selector UI state (first-time hint + persistent
// expanded state).
export const LENS_DISCOVERED_KEY = "aristotelian-lens-discovered";
export const LENS_HINT_DISMISSED_KEY = "aristotelian-lens-hint-dismissed";
