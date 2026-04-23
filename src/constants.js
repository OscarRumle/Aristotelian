export const STORAGE_KEY = "aristotelian-worlds-v2";
export const STORAGE_VERSION = 4;

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

export const PLACEHOLDER_DESC = `Grand theft auto and Guy Ritchie's "the Gentlemen" inspired world. Set in New York in 1991. Dark Comedy, Drama.`;

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
