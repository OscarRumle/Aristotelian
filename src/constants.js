export const STORAGE_KEY = "aristotelian-worlds-v2";
export const STORAGE_VERSION = 8;

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
