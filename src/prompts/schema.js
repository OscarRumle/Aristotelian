// Single source of truth for the Character JSON schema that all three prompt
// builders (build / expand / regen) hand to the model. Adding a new field?
// Edit here once.

export const CHARACTER_SCHEMA = `{"name":"","age":"","gender":"","race":"","role":"","style":"","summary":["","",""],"appearance":"","clothing":"","details":"","background":"","personality":"","desires":"","fears":"","moralCore":"","hamartia":"","consistency":"","speechMode":"","underPressure":"","subtext":"","voicePattern":"","collectiveHamartia":"","relationships":[],"aristotelianNote":"","quote":""}`;

export const ROLE_INSTRUCTIONS = {
  Lead: `This is a LEAD character. They need the full Aristotelian treatment: a complete hamartia arc where their greatest quality becomes the mechanism of their downfall. Their choices must drive the central reversal. They must be capable of anagnorisis.`,
  Deuteragonist: (targetLead) =>
    `This is a DEUTERAGONIST — the second substantial character. Their hamartia must be COMPLEMENTARY to the Lead's, not identical. The two characters' specific qualities should intersect so the central conflict is inevitable.${
      targetLead
        ? `\n\nTARGET LEAD FOR INTERLOCKING:\n${JSON.stringify(targetLead, null, 2)}\n\nThe deuteragonist's hamartia must interlock with the lead's. Ask: does this character's specific error make the lead's error more inevitable?`
        : ""
    }`,
  Supporting: `This is a SUPPORTING character. They need the four requirements (goodness, appropriateness, likeness to truth, consistency) but NOT a full hamartia arc. Their function is to reveal the lead — they exist to create conditions where the lead's character becomes visible. Leave hamartia minimal unless it directly serves that function.`,
  Minor: `This is a MINOR character. They need appropriateness and consistency only. They want something in their scene — it may be small but it must be real. They should feel like a person with an entire life offscreen even if we only see one moment. Keep hamartia and aristotelianNote brief or minimal.`,
  Ensemble: `This is an ENSEMBLE member. They carry a fraction of the protagonist function. They need a compressed Aristotelian arc — a recognizable mini-structure where their specific quality creates a specific error. Include a collectiveHamartia field describing the shared assumption or worldview the ensemble collectively carries.`,
};

export const STYLE_INSTRUCTIONS = {
  Tragic: `STYLE — TRAGIC: The hamartia must produce consequences that are IRREVERSIBLE. The character cannot return to where they started. Their error must emerge from genuine virtue pressed too far, not pre-existing wickedness. The audience must feel: I understand how this happened. I can see how I might have done the same.`,
  Comic: `STYLE — COMIC (Aristotelian structural comedy, not "lighter-toned tragic"):

FOUNDATION:
Comedy = a specific, visible deficiency + consequences that stop short of real lasting harm. Both conditions are required. A deficiency with real consequences is tragedy. Harmlessness without a specific deficiency is just pleasantness. Comic depth comes from the SPECIFICITY of the character's wrongness, not from suffering.

THE GAP (the engine of all comedy):
Every comic character depends on a gap — between what the character believes is true and what the audience can see is actually true. The audience's position of knowledge relative to the character's ignorance is the source of the comedy. The gap must be visible to the audience clearly and EARLY. A full recognition that closes the gap ends the comedy — defer or deflect recognition.

CHOOSE ONE COMIC TYPE (and write the character to fit it structurally):

1. OBSERVER — Funny because they see clearly when everyone else is pretending. They name the gap between how things are and how people claim they are. Their hamartia: they cannot pretend, and most social contexts require pretending. Voice: specific, direct, no hedging. Quote: the accurate thing said with no awareness of how it lands. Gap runs OUTWARD from character to room.

2. DEEP COMIC — Humor is inseparable from their psychology and from real dramatic stakes. The same quality generates BOTH the jokes AND the damage. The comedy IS the worldview or defense mechanism — remove it and you have a broken character, not a serious one. Gap runs VERTICALLY between surface and interior. Their quote must contain both the humor and the thing underneath.

3. JOYFUL FOOL — Operates on a completely different register than the situation requires, with full sincerity. Earnest obliviousness. Must be WARM — their moral core is usually loyalty, care, or genuine warmth. A cold Joyful Fool is a sociopath, not a Joyful Fool. Gap runs INWARD: they're in the dark, everyone sees it, no darkness underneath.

4. TRAGIC CLOWN — Uses humor as a force field against real prior pain. The jokes are learned protective behavior. The audience senses the weight underneath the humor. What they never joke about IS the character. Gap runs VERTICALLY between what they show and what they carry.

5. SOCIAL TRANSGRESSOR — Says the thing nobody is supposed to say in the situation where it most shouldn't be said. The laugh is cathartic norm-violation. Requires sufficient social pretense to push against. Their hamartia: cannot distinguish hollow norms from real ones. Gap runs LATERALLY between character and the room's social performance.

6. SELF-DEFEATING SCHEMER — The elaborate planner who is the instrument of their own failure. The scheme must have internal logic — they're not stupid, the comedy comes from the gap between coherent internal logic and reality. The quality they believe is their strength IS the mechanism of disaster. Recognition is perpetually deferred.

THE AFFECTION TEST:
The audience's superiority must be AFFECTIONATE, not contemptuous. Test: does the audience want this character to be okay, even while laughing at them? If the audience wants them to fail and be humiliated, the superiority has tipped to contempt and it's no longer Aristotelian comedy. The wrongness must be recognizably human — we see ourselves in it.

COMIC ANAGNORISIS:
Characteristically partial, delayed, or immediately reversed. The character almost sees the truth, then retreats. They glimpse what the audience has been seeing and find a way to not see it anymore. The approach AND the retreat are both the joke. Fully closing the gap ends the comedy.

WHAT BREAKS COMIC STYLE:
- Genuine lasting harm (tips into tragedy — use Mixed instead)
- Full self-awareness (collapses the gap)
- Blandness (vague "a bit awkward" is not a specific deficiency)
- Contempt (audience wants them to suffer, not be okay)

FIELD DIRECTIVES FOR COMIC CHARACTERS:
- hamartia: Frame as a SPECIFIC wrongness, not a personality description. Name the exact thing they are wrong about and the exact mechanism through which it produces recoverable chaos. Identify which of the six types they are.
- consistency: The comic deficiency must produce errors in the same way every time. The audience must be able to predict the pattern.
- moralCore: A comic character without a moral core becomes mean, not funny. Name what they care about — even if small, unglamorous, or misplaced.
- quote: Must reflect their specific comic type (see each type above). It should reveal the gap without announcing it.
- aristotelianNote: Identify the comic type, where the gap lives, and pass the affection test explicitly.`,
  Mixed: `STYLE — MIXED (Dark Comedy): This is the collision of tragic and comic structural logics. The character behaves comically — their flaw produces recognizable, seemingly-harmless chaos — but the stakes turn out to be real. The comedy is not relief from the tragedy; it is the mechanism that makes the tragedy land harder. The audience must always know which mode is in control at any given moment — tonal surprise is powerful, tonal confusion is alienating. Pick a comic type (Observer / Deep Comic / Joyful Fool / Tragic Clown / Social Transgressor / Self-Defeating Schemer) and build the character to fit it — but let the consequences land with real weight.`,
};

export const FRAMEWORK_BLOCK = `ARISTOTLE'S FRAMEWORK:
1. GOODNESS: Stand for something worth protecting, even at cost. Specific, not vague.
2. APPROPRIATENESS: Traits and behaviors must cohere with background and world.
3. LIKENESS TO TRUTH: Recognizably human — desires, fears, contradictions, blind spots.
4. CONSISTENCY: Behavior follows a logic. One sentence.
5. HAMARTIA: Not a flaw — a specific error from their greatest strength. Same quality, different circumstances.

DIALOGUE FRAMEWORK (Aristotle's Rhetoric):
- speechMode: Primary mode under pressure — "Ethos" (authority), "Pathos" (emotion), or "Logos" (logic).
- underPressure: What they actually DO when cornered in conversation. Behavioral pattern, not words.
- subtext: The true thing they always talk AROUND but never directly at. The wound beneath the words.
- voicePattern: How they speak structurally. Rhythm, deflection, characteristic evasion.`;
