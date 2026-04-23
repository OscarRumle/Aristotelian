import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════════ */
const FONTS_URL = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500&display=swap";
const PLACEHOLDER_DESC = `Grand theft auto and Guy Ritchie's "the Gentlemen" inspired world. Set in New York in 1991. Dark Comedy, Drama.`;
const STORAGE_KEY = "aristotelian-worlds-v2";

// streamMarker: when this string appears in the streaming JSON, the phase content is done
const PHASES = [
  { id: "identity",   label: "Identity",         streamMarker: '"summary"',       verbs: ["Choosing a name…","Picking the face…","Finding the features…","Sketching the silhouette…","Placing them in the world…","Giving them a body…","Deciding who they are…","Setting the scene…"] },
  { id: "history",    label: "History",           streamMarker: '"personality"',   verbs: ["Digging through the past…","Finding the wound…","Counting the years…","Tracing the scars…","Reading the record…","Laying the groundwork…","Following the trail back…","Excavating the damage…"] },
  { id: "psychology", label: "Psychology",        streamMarker: '"moralCore"',     verbs: ["Mapping the desires…","Weighing the fears…","Reading the cracks…","Probing the damage…","Measuring the want…","Finding what keeps them up at night…","Locating the obsession…","Charting the need…"] },
  { id: "core",       label: "Aristotelian Core", streamMarker: '"speechMode"',   verbs: ["Consulting the Greeks…","Finding the hamartia…","Naming the flaw…","Weighing the virtue…","Measuring the grief…","Reading the omens…","Counting the debts…","Locating the tragedy…","Sharpening the edges…","Identifying the downfall…"] },
  { id: "dialogue",   label: "Dialogue",          streamMarker: '"aristotelianNote"', verbs: ["Tuning the voice…","Learning the lies…","Finding the evasions…","Sharpening the tongue…","Hearing the silence…","Practicing the deflections…","Choosing what goes unsaid…","Calibrating the subtext…"] },
  { id: "finishing",  label: "Finishing",         streamMarker: null,              verbs: ["Summoning the soul…","Finishing the portrait…","One last look…","Bringing it all together…","Almost there…","Final touches…","Signing the work…"] },
];
const MIN_PHASE_MS = 4000;

const PHIL = {
  appearance:   "Likeness to truth: even in extraordinary worlds, characters must remain recognizably human. Physical details are not decoration — they are the body that carries the soul.",
  personality:  "Appropriateness: their traits must feel earned and contextually grounded. Behaviors and values must be plausible given their background, role, and world.",
  desires:      "Surface goal. What the character thinks they want. This may not be what they actually need — that tension is often the story.",
  fears:        "What they avoid. What haunts them. Fear is what makes choices cost something — and without cost, there is no character.",
  moralCore:    "Character is not what a person thinks or feels in private. Character is what a person does under pressure. What would they protect even at cost? It doesn't need to be admirable — it needs to exist.",
  hamartia:     "Not a flaw. A specific error that emerges from their greatest strength. The best quality and the worst mistake are the same thing in different circumstances. Oedipus's relentless curiosity makes him a great king — and destroys him.",
  consistency:  "A character's behavior must follow a logic. State it in one sentence. A character who is consistently unpredictable is still consistent — the audience learns to anticipate the unpredictability.",
  speechMode:   "Aristotle's Rhetoric identifies three modes of persuasion: Ethos (authority/credibility — 'trust me because of who I am'), Pathos (emotion — 'feel what I feel'), Logos (logic — 'here is the reasoning'). The most revealing moment: which mode does this character retreat to when losing?",
  underPressure:"Character is revealed under pressure, not in comfort. A conversation where nothing is at stake is not a dramatic scene. What does this character actually do when cornered?",
  subtext:      "The true thing said directly is dianoia — it tells the audience what the character thinks. The true thing visible beneath what the character says is ethos — it shows who they are. What does this character always talk around but never at?",
  voicePattern: "A character's voice is not style. It is the sound of their specific configuration of values, fears, and habits under pressure. Get the character right, and the voice follows.",
};

const ROLE_OPTIONS = [
  { value: "Lead",          label: "Lead",          desc: "Drives the central reversal" },
  { value: "Deuteragonist", label: "Deuteragonist", desc: "Second engine, interlocked hamartia" },
  { value: "Supporting",    label: "Supporting",    desc: "Reveals the lead, no full arc" },
  { value: "Minor",         label: "Minor",         desc: "Makes specific moments possible" },
  { value: "Ensemble",      label: "Ensemble",      desc: "Shares the protagonist function" },
];

const STYLE_OPTIONS = [
  { value: "Tragic", label: "Tragic", desc: "Error is irreversible" },
  { value: "Comic",  label: "Comic",  desc: "Flaw costs nothing serious" },
  { value: "Mixed",  label: "Mixed",  desc: "Comic surface, tragic core" },
];

const uid       = () => Math.random().toString(36).slice(2, 9);
const metaLine  = (c) => [c.race, c.gender, c.age].filter(Boolean).join(" · ") || null;
const randItem  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const isFullRole = (r) => !r || r === "Lead" || r === "Deuteragonist" || r === "Ensemble";
const isMini    = (r) => r === "Minor";
const isSupport = (r) => r === "Supporting";

/* ═══════════════════════════════════════════════════════════════════════════
   API & PROMPT HELPERS
═══════════════════════════════════════════════════════════════════════════ */
async function callClaude(system, userMsg, maxTokens = 2000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text || "";
  if (!text) throw new Error("Empty response");
  return text;
}

// Streaming variant — calls onChunk(accumulatedText) as JSON arrives
async function callClaudeStreaming(system, userMsg, maxTokens = 2000, onChunk) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      stream: true,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value, { stream: true }).split("\n");
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") continue;
      try {
        const evt = JSON.parse(raw);
        if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
          accumulated += evt.delta.text;
          onChunk?.(accumulated);
        }
      } catch {}
    }
  }
  if (!accumulated) throw new Error("Empty response");
  return accumulated;
}

function buildPrompt(world, existingChars, inputs, targetLead) {
  const { role, style, pitch, ...fields } = inputs;

  const existing = existingChars.length
    ? existingChars.map(c => `- ${c.name} (${c.role || "Unknown role"}) — ${c.consistency || c.summary?.[0] || ""}`).join("\n")
    : "None yet";

  const userInput = Object.entries({ pitch, ...fields })
    .filter(([, v]) => v?.trim?.())
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n") || "None — generate freely.";

  const roleInstructions = {
    Lead: `This is a LEAD character. They need the full Aristotelian treatment: a complete hamartia arc where their greatest quality becomes the mechanism of their downfall. Their choices must drive the central reversal. They must be capable of anagnorisis.`,
    Deuteragonist: `This is a DEUTERAGONIST — the second substantial character. Their hamartia must be COMPLEMENTARY to the Lead's, not identical. The two characters' specific qualities should intersect so the central conflict is inevitable.${targetLead ? `\n\nTARGET LEAD FOR INTERLOCKING:\n${JSON.stringify(targetLead, null, 2)}\n\nThe deuteragonist's hamartia must interlock with the lead's. Ask: does this character's specific error make the lead's error more inevitable?` : ""}`,
    Supporting: `This is a SUPPORTING character. They need the four requirements (goodness, appropriateness, likeness to truth, consistency) but NOT a full hamartia arc. Their function is to reveal the lead — they exist to create conditions where the lead's character becomes visible. Leave hamartia minimal unless it directly serves that function.`,
    Minor: `This is a MINOR character. They need appropriateness and consistency only. They want something in their scene — it may be small but it must be real. They should feel like a person with an entire life offscreen even if we only see one moment. Keep hamartia and aristotelianNote brief or minimal.`,
    Ensemble: `This is an ENSEMBLE member. They carry a fraction of the protagonist function. They need a compressed Aristotelian arc — a recognizable mini-structure where their specific quality creates a specific error. Include a collectiveHamartia field describing the shared assumption or worldview the ensemble collectively carries.`,
  };

  const styleInstructions = {
    Tragic: `STYLE — TRAGIC: The hamartia must produce consequences that are IRREVERSIBLE. The character cannot return to where they started. Their error must emerge from genuine virtue pressed too far, not pre-existing wickedness. The audience must feel: I understand how this happened. I can see how I might have done the same.`,
    Comic:  `STYLE — COMIC: The character's deficiency must be specific and visible to the audience before it's visible to them. Consequences must stop short of causing real lasting pain. The audience's superiority to the character should be affectionate, not contemptuous. The character can recover — return to normalcy is possible.`,
    Mixed:  `STYLE — MIXED (Dark Comedy): This is the collision of tragic and comic structural logics. The character behaves comically — their flaw produces recognizable, seemingly-harmless chaos — but the stakes turn out to be real. The comedy is not relief from the tragedy; it is the mechanism that makes the tragedy land harder.`,
  };

  return `You are a character creation assistant trained on Aristotle's Poetics, Rhetoric, and the full dramatic framework.

WORLD: ${world.name}
${world.description}

EXISTING CHARACTERS:
${existing}

${role && roleInstructions[role] ? roleInstructions[role] + "\n" : "Choose the most dramatically appropriate role for this character given the world and existing cast.\n"}
${style && styleInstructions[style] ? styleInstructions[style] + "\n" : ""}
ARISTOTLE'S FRAMEWORK:
1. GOODNESS: Stand for something worth protecting, even at cost. Specific, not vague.
2. APPROPRIATENESS: Traits and behaviors must cohere with background and world.
3. LIKENESS TO TRUTH: Recognizably human — desires, fears, contradictions, blind spots.
4. CONSISTENCY: Behavior follows a logic. One sentence.
5. HAMARTIA: Not a flaw — a specific error from their greatest strength. Same quality, different circumstances.

DIALOGUE FRAMEWORK (Aristotle's Rhetoric):
- speechMode: Primary mode under pressure — "Ethos" (authority), "Pathos" (emotion), or "Logos" (logic).
- underPressure: What they actually DO when cornered in conversation. Behavioral pattern, not words.
- subtext: The true thing they always talk AROUND but never directly at. The wound beneath the words.
- voicePattern: How they speak structurally. Rhythm, deflection, characteristic evasion.

USER INPUT:
${userInput}

FIELD INSTRUCTIONS:
- "role": If not specified by user, choose the most dramatically interesting role given the world and cast.
- "style": If not specified, choose Tragic/Comic/Mixed based on what serves this character's story best.
- "summary": Array of exactly 3 strings. One punchy sentence each — the most dramatically interesting things. Not backstory. The stuff that makes someone lean in.
- "quote": One line of dialogue or internal thought that perfectly captures their voice.
- "aristotelianNote": 3-5 sentences on how this character satisfies Aristotle's four requirements.
- "collectiveHamartia": For Ensemble only — the shared assumption or worldview the ensemble collectively carries into their downfall. Empty string otherwise.

Return ONLY valid JSON. No preamble. No markdown fences.
{"name":"","age":"","gender":"","race":"","role":"","style":"","summary":["","",""],"appearance":"","clothing":"","details":"","background":"","personality":"","desires":"","fears":"","moralCore":"","hamartia":"","consistency":"","speechMode":"","underPressure":"","subtext":"","voicePattern":"","collectiveHamartia":"","relationships":[],"aristotelianNote":"","quote":""}`;
}

function buildExpandPrompt(world, character) {
  return `You are expanding a character who was initially created with limited fields. Fill in ALL missing or empty fields to give this character a full dramatic treatment.

WORLD: ${world.name}
${world.description}

EXISTING CHARACTER (partial):
${JSON.stringify(character, null, 2)}

Generate all missing fields. Be consistent with what already exists. Apply the full Aristotelian framework.
For dialogue fields: speechMode must be "Ethos", "Pathos", or "Logos".

Return ONLY valid JSON with the COMPLETE character. No preamble. No markdown fences.
{"name":"","age":"","gender":"","race":"","role":"","style":"","summary":["","",""],"appearance":"","clothing":"","details":"","background":"","personality":"","desires":"","fears":"","moralCore":"","hamartia":"","consistency":"","speechMode":"","underPressure":"","subtext":"","voicePattern":"","collectiveHamartia":"","relationships":[],"aristotelianNote":"","quote":""}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOOK — generating progress (streaming-aware, 4s minimum per phase)
═══════════════════════════════════════════════════════════════════════════ */
function useGeneratingProgress(active, accumulated) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [doneIds, setDoneIds]   = useState([]);
  const [verb, setVerb]         = useState("");
  const [justDone, setJustDone] = useState(false); // triggers green flash
  const state = useRef({ idx: 0, startedAt: 0, pendingDone: new Set(), verbTimer: null });

  const clearVerb = () => clearInterval(state.current.verbTimer);

  const completePhase = (id) => {
    setDoneIds(prev => prev.includes(id) ? prev : [...prev, id]);
    setJustDone(true);
    setTimeout(() => {
      setJustDone(false);
      state.current.idx++;
      startPhase(state.current.idx);
    }, 900); // hold green for 900ms then advance
  };

  const scheduleComplete = (id, minMs) => {
    const elapsed = Date.now() - state.current.startedAt;
    const delay   = Math.max(0, minMs - elapsed);
    if (state.current.pendingDone.has(id)) return;
    state.current.pendingDone.add(id);
    setTimeout(() => completePhase(id), delay);
  };

  const startPhase = (idx) => {
    if (idx >= PHASES.length) return;
    const p = PHASES[idx];
    state.current.startedAt = Date.now();
    setPhaseIdx(idx);
    setVerb(randItem(p.verbs));
    clearVerb();
    state.current.verbTimer = setInterval(() => setVerb(randItem(p.verbs)), 1600);
  };

  // Start/reset when active changes
  useEffect(() => {
    if (!active) {
      clearVerb();
      setPhaseIdx(0);
      setDoneIds([]);
      setVerb("");
      setJustDone(false);
      state.current = { idx: 0, startedAt: 0, pendingDone: new Set(), verbTimer: null };
      return;
    }
    startPhase(0);
    return clearVerb;
  }, [active]);

  // Detect phase completion from streaming text
  useEffect(() => {
    if (!active || !accumulated) return;
    PHASES.forEach((p, i) => {
      if (i > state.current.idx) return; // not reached yet
      if (state.current.pendingDone.has(p.id)) return; // already scheduled
      if (!p.streamMarker) {
        // Last phase — complete when we see end of JSON
        if (accumulated.trimEnd().endsWith("}")) scheduleComplete(p.id, MIN_PHASE_MS);
        return;
      }
      if (accumulated.includes(p.streamMarker)) scheduleComplete(p.id, MIN_PHASE_MS);
    });
  }, [accumulated, active]);

  return { phaseIdx, doneIds, verb, justDone };
}

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════════════ */
const STYLES = `
@import url('${FONTS_URL}');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#F4EDE4;--surface:#FDF8F0;
  --amber:#B8956A;--sage:#7B9E80;--dust:#C4806A;
  --dark:#2B2018;--muted:#9A8C85;--faint:#B0A49C;
  --serif:'Cormorant Garamond',Georgia,serif;
  --sans:'Jost',sans-serif;
}
body{background:var(--bg);font-family:var(--sans);min-height:100vh;-webkit-tap-highlight-color:transparent;}
.ambient{position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 25% 20%,rgba(200,168,128,.14) 0%,transparent 55%),radial-gradient(ellipse at 75% 78%,rgba(122,158,126,.09) 0%,transparent 45%),var(--bg);}
.app{position:relative;z-index:1;min-height:100vh;display:flex;justify-content:center;}
.screen{width:100%;max-width:420px;padding:0 1.25rem 7rem;animation:fadeUp .4s ease both;}

@keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse{0%,100%{opacity:.3;}50%{opacity:1;}}
@keyframes verbIn{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:translateY(0);}}
@keyframes checkIn{from{opacity:0;transform:scale(.7);}to{opacity:1;transform:scale(1);}}

/* Typography */
.t-eyebrow{font-family:var(--sans);font-size:.65rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--faint);}
.t-display{font-family:var(--serif);font-size:2.6rem;font-weight:300;color:var(--dark);line-height:1.05;}
.t-heading{font-family:var(--serif);font-size:1.8rem;font-weight:400;color:var(--dark);line-height:1.15;}
.t-body{font-family:var(--sans);font-size:.88rem;color:var(--muted);line-height:1.8;}
.t-quote{font-family:var(--serif);font-style:italic;font-size:1.05rem;color:var(--amber);line-height:1.65;}
.t-hint{font-family:var(--sans);font-size:.65rem;color:var(--faint);text-align:right;}
.divider{width:100%;height:1px;background:rgba(184,149,106,.15);}

/* Buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border:none;cursor:pointer;font-family:var(--sans);font-size:.82rem;font-weight:400;letter-spacing:.13em;text-transform:uppercase;border-radius:50px;padding:.88rem 2.4rem;transition:transform .15s,opacity .15s;width:100%;}
.btn:active:not(:disabled){transform:scale(.97);opacity:.85;}
.btn-primary{background:var(--amber);color:var(--surface);}
.btn-ghost{background:rgba(196,128,106,.10);color:var(--dust);border:1px solid rgba(196,128,106,.22);}
.btn-sage{background:var(--sage);color:var(--surface);}
.btn:disabled{opacity:.4;cursor:not-allowed;}

/* Back nav */
.back-btn{display:inline-flex;align-items:center;gap:.35rem;font-family:var(--sans);font-size:.7rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);background:none;border:none;cursor:pointer;padding:0;transition:color .2s;}
.back-btn:hover{color:var(--amber);}

/* Form */
.f-label{display:block;font-family:var(--sans);font-size:.67rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);margin-bottom:.4rem;}
.f-input,.f-area{font-family:var(--sans);font-size:.9rem;font-weight:300;color:var(--dark);background:rgba(244,237,228,.7);border:1px solid rgba(184,149,106,.25);border-radius:12px;padding:.78rem 1rem;width:100%;outline:none;display:block;transition:border-color .2s,background .2s;}
.f-input::placeholder,.f-area::placeholder{color:var(--faint);}
.f-input:focus,.f-area:focus{border-color:rgba(184,149,106,.55);background:rgba(253,250,246,.9);}
.f-area{resize:vertical;line-height:1.65;}
.f-row{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;}
.s-label{font-family:var(--sans);font-size:.63rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--amber);padding:.5rem 0 .1rem;display:block;}
.form-stack{display:flex;flex-direction:column;gap:1.1rem;padding-top:.5rem;}

/* Pill selector */
.pill-group{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.1rem;}
.pill{font-family:var(--sans);font-size:.72rem;font-weight:400;letter-spacing:.08em;background:none;border:1px solid rgba(184,149,106,.25);border-radius:50px;padding:.4rem .9rem;color:var(--faint);cursor:pointer;transition:all .15s;}
.pill:hover{border-color:rgba(184,149,106,.5);color:var(--muted);}
.pill.active{background:var(--amber);border-color:var(--amber);color:var(--surface);}
.pill-desc{font-size:.65rem;font-style:italic;color:var(--faint);font-family:var(--serif);margin-top:.25rem;}

/* Bottom bar */
.bottom-bar{position:fixed;bottom:0;left:0;right:0;z-index:100;display:flex;justify-content:center;padding:1rem 1.25rem 1.8rem;background:linear-gradient(to top,rgba(244,237,228,.97) 55%,transparent);}
.bottom-bar-inner{width:100%;max-width:420px;display:flex;flex-direction:column;gap:.6rem;}

/* List cards */
.card{background:rgba(253,250,246,.9);border-radius:18px;padding:1.3rem 1.5rem;border:1px solid rgba(220,210,198,.6);cursor:pointer;transition:transform .2s,box-shadow .2s;display:flex;flex-direction:column;gap:.5rem;}
.card:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(60,40,20,.07);}
.card-top{display:flex;align-items:center;justify-content:space-between;gap:.75rem;}
.card-name{font-family:var(--serif);font-size:1.25rem;font-weight:400;color:var(--dark);}
.card-role-line{font-family:var(--serif);font-size:.88rem;font-style:italic;color:var(--muted);}
.card-badge{font-family:var(--sans);font-size:.6rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);background:rgba(184,149,106,.1);padding:.22rem .6rem;border-radius:20px;white-space:nowrap;flex-shrink:0;}
.card-quote{font-family:var(--serif);font-style:italic;font-size:.88rem;color:var(--amber);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.card-desc{font-size:.82rem;color:var(--muted);line-height:1.55;font-family:var(--sans);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.card-cta{font-size:.7rem;color:var(--amber);font-family:var(--sans);font-weight:500;align-self:flex-end;}

/* Page heads */
.page-head{padding:2.75rem 0 1.5rem;display:flex;flex-direction:column;gap:.5rem;}
.page-head-nav{margin-bottom:.5rem;}

/* Empty state */
.empty{display:flex;flex-direction:column;align-items:center;gap:1.5rem;padding:4rem 1rem;text-align:center;}
.empty-rule{width:28px;height:1px;background:rgba(184,149,106,.3);}

/* Toggle optional */
.toggle-btn{display:flex;align-items:center;justify-content:center;gap:.4rem;background:none;border:1px dashed rgba(184,149,106,.28);border-radius:10px;padding:.65rem 1rem;color:var(--faint);font-family:var(--sans);font-size:.75rem;letter-spacing:.08em;cursor:pointer;width:100%;transition:border-color .2s,color .2s;}
.toggle-btn:hover{border-color:rgba(184,149,106,.55);color:var(--amber);}

/* Character sheet header */
.char-header{padding:2.5rem 0 1.25rem;display:flex;flex-direction:column;gap:.5rem;}
.char-name{font-family:var(--serif);font-size:2.2rem;font-weight:300;color:var(--dark);line-height:1.1;}
.char-role{font-family:var(--serif);font-size:1.1rem;font-weight:300;font-style:italic;color:var(--muted);}
.char-meta{font-family:var(--sans);font-size:.75rem;color:var(--faint);letter-spacing:.04em;}
.char-tags{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.1rem;}
.char-tag{font-family:var(--sans);font-size:.62rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;padding:.22rem .65rem;border-radius:20px;border:1px solid rgba(184,149,106,.3);color:var(--amber);}
.char-tag.sage{color:var(--sage);border-color:rgba(123,158,128,.3);}
.char-summary{list-style:none;display:flex;flex-direction:column;gap:.4rem;padding:.15rem 0;}
.char-summary-item{font-family:var(--sans);font-size:.86rem;color:var(--muted);line-height:1.7;padding-left:1.1rem;position:relative;}
.char-summary-item::before{content:"—";position:absolute;left:0;color:var(--amber);}
.char-quote{font-family:var(--serif);font-style:italic;font-size:1rem;color:var(--amber);line-height:1.65;padding:.4rem 0;}

/* Tab bar */
.tab-bar{display:flex;border-bottom:1px solid rgba(184,149,106,.15);margin-bottom:1.5rem;overflow-x:auto;-webkit-overflow-scrolling:touch;}
.tab-bar::-webkit-scrollbar{display:none;}
.tab-btn{font-family:var(--sans);font-size:.67rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;padding:.75rem .85rem .65rem;white-space:nowrap;transition:color .2s,border-color .2s;margin-bottom:-1px;flex-shrink:0;}
.tab-btn.active{color:var(--amber);border-bottom-color:var(--amber);}
.tab-btn:hover:not(.active){color:var(--muted);}

/* Character fields */
.cs-section{display:flex;flex-direction:column;gap:1.1rem;padding:1rem 0;}
.cs-section-title{font-family:var(--sans);font-size:.63rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--amber);padding-bottom:.4rem;border-bottom:1px solid rgba(184,149,106,.15);}
.cs-field{display:flex;flex-direction:column;gap:.3rem;}
.cs-field-head{display:flex;align-items:center;justify-content:space-between;}
.cs-field-label{font-family:var(--sans);font-size:.65rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);}
.cs-field-actions{display:flex;gap:.4rem;align-items:center;}
.cs-field-body{font-family:var(--sans);font-size:.88rem;color:var(--muted);line-height:1.8;}
.cs-field-regen{font-family:var(--serif);font-style:italic;font-size:.85rem;color:var(--amber);line-height:1.6;animation:verbIn .3s ease both;}
.cs-field-error{font-family:var(--sans);font-size:.72rem;color:var(--dust);margin-top:.2rem;}
.cs-speech-tag{display:inline-block;font-family:var(--sans);font-size:.65rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;padding:.25rem .7rem;border-radius:20px;background:rgba(184,149,106,.12);color:var(--amber);border:1px solid rgba(184,149,106,.25);}
.locked-field{background:rgba(184,149,106,.05);border:1px dashed rgba(184,149,106,.2);border-radius:12px;padding:1rem 1.1rem;display:flex;flex-direction:column;gap:.4rem;}
.locked-label{font-family:var(--sans);font-size:.65rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);}
.locked-msg{font-family:var(--serif);font-style:italic;font-size:.85rem;color:var(--faint);}

.icon-btn{background:none;border:1px solid rgba(184,149,106,.22);border-radius:8px;padding:.28rem .5rem;font-size:.78rem;color:var(--faint);cursor:pointer;font-family:var(--sans);transition:color .2s,border-color .2s;line-height:1;}
.icon-btn:hover:not(:disabled){color:var(--amber);border-color:rgba(184,149,106,.45);}
.icon-btn:disabled{opacity:.35;cursor:not-allowed;}
.phil-note{font-family:var(--serif);font-style:italic;font-size:.85rem;color:var(--faint);line-height:1.65;margin-top:.3rem;animation:fadeUp .25s ease both;padding-left:.1rem;}
.analysis-toggle{display:flex;align-items:center;justify-content:space-between;background:none;border:none;cursor:pointer;width:100%;padding:.9rem 0;border-top:1px solid rgba(184,149,106,.15);}
.analysis-label{font-family:var(--sans);font-size:.63rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--amber);}
.analysis-body{font-family:var(--sans);font-size:.87rem;color:var(--muted);line-height:1.85;padding:.5rem 0 1.5rem;animation:fadeUp .3s ease both;}
.rel-entry{padding:.9rem 0;border-bottom:1px solid rgba(184,149,106,.1);display:flex;flex-direction:column;gap:.3rem;}
.rel-name{font-family:var(--serif);font-size:1rem;font-weight:400;color:var(--dark);}
.rel-desc{font-family:var(--sans);font-size:.82rem;color:var(--muted);line-height:1.65;}

/* Generating overlay */
.gen-overlay{position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;background:rgba(244,237,228,.98);}
.gen-verb-wrap{display:flex;flex-direction:column;align-items:center;gap:.65rem;text-align:center;padding:0 2rem;}
.gen-verb{font-family:var(--serif);font-style:italic;font-size:1.55rem;line-height:1.4;min-height:2.2rem;text-align:center;max-width:300px;}
.gen-phase-name{font-family:var(--sans);font-size:.62rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--faint);}

/* Error */
.error-toast{display:flex;gap:.75rem;background:rgba(196,128,106,.1);border:1px solid rgba(196,128,106,.28);border-radius:14px;padding:1rem 1.1rem;animation:fadeUp .25s ease both;}
.error-toast-icon{font-size:.9rem;color:var(--dust);flex-shrink:0;}
.error-toast-body{display:flex;flex-direction:column;gap:.5rem;flex:1;}
.error-toast-msg{font-family:var(--sans);font-size:.84rem;color:var(--dust);line-height:1.6;}
.error-toast-retry{font-family:var(--sans);font-size:.72rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--amber);background:none;border:1px solid rgba(184,149,106,.3);border-radius:20px;padding:.35rem .85rem;cursor:pointer;align-self:flex-start;transition:background .2s;}
.error-toast-retry:hover{background:rgba(184,149,106,.08);}

/* Saved */
.save-indicator{position:fixed;top:1rem;right:1.25rem;z-index:200;display:flex;align-items:center;gap:.35rem;}
.save-dot{width:6px;height:6px;border-radius:50%;background:var(--sage);animation:pulse .8s ease 3;}
`;

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */
// Animated dots: cycles . .. ...
function AnimatedDots() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setDots(d => d >= 3 ? 1 : d + 1), 420);
    return () => clearInterval(id);
  }, []);
  return <span style={{ letterSpacing: ".05em" }}>{".​".repeat(dots - 1) + "."}</span>;
}

// Typewriter: reveals text char by char
function Typewriter({ text, onDone }) {
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); }, [text]);
  useEffect(() => {
    if (n >= text.length) { onDone?.(); return; }
    const id = setTimeout(() => setN(p => p + 1), 32);
    return () => clearTimeout(id);
  }, [n, text]);
  return <>{text.slice(0, n)}</>;
}

function GeneratingOverlay({ phaseIdx, doneIds, verb, justDone }) {
  const [typed, setTyped] = useState(false);
  useEffect(() => setTyped(false), [verb]);
  const isDone  = justDone;
  const color   = isDone ? "var(--sage)" : "var(--amber)";
  return (
    <div className="gen-overlay">
      <div className="gen-verb-wrap">
        <p className="gen-verb" style={{ color, transition: "color .4s ease" }}>
          <Typewriter key={verb} text={verb} onDone={() => setTyped(true)} />
          {typed && !isDone && <AnimatedDots />}
          {isDone && <span style={{ marginLeft: ".35em", animation: "checkIn .3s ease both" }}>✓</span>}
        </p>
        <p className="gen-phase-name">{PHASES[phaseIdx]?.label}</p>
      </div>
    </div>
  );
}

function ErrorToast({ message, onRetry }) {
  return (
    <div className="error-toast">
      <span className="error-toast-icon">!</span>
      <div className="error-toast-body">
        <p className="error-toast-msg">{message}</p>
        {onRetry && <button className="error-toast-retry" onClick={onRetry}>Retry</button>}
      </div>
    </div>
  );
}

function BottomBar({ children }) {
  return <div className="bottom-bar"><div className="bottom-bar-inner">{children}</div></div>;
}

function EmptyState({ quote, body }) {
  return (
    <div className="empty">
      <div className="empty-rule" />
      <p className="t-quote" style={{ maxWidth: 270 }}>{quote}</p>
      <p className="t-body" style={{ maxWidth: 250, textAlign: "center" }}>{body}</p>
      <div className="empty-rule" />
    </div>
  );
}

function PillSelect({ label, options, value, onChange, hint }) {
  return (
    <div>
      <label className="f-label">{label}</label>
      <div className="pill-group">
        {options.map(o => (
          <button key={o.value}
            className={`pill ${value === o.value ? "active" : ""}`}
            onClick={() => onChange(value === o.value ? "" : o.value)}>
            {o.label}
          </button>
        ))}
      </div>
      {hint && <p className="pill-desc">{hint}</p>}
    </div>
  );
}

function CharField({ label, value, fieldKey, onRegen, regenningKey, philNote, children }) {
  const [showPhil, setShowPhil] = useState(false);
  const isRegenning = regenningKey === fieldKey;
  return (
    <div className="cs-field">
      <div className="cs-field-head">
        <span className="cs-field-label">{label}</span>
        <div className="cs-field-actions">
          {philNote && <button className="icon-btn" onClick={() => setShowPhil(p => !p)}>?</button>}
          <button className="icon-btn" onClick={() => onRegen(fieldKey)} disabled={!!regenningKey}>
            {isRegenning ? "…" : "↻"}
          </button>
        </div>
      </div>
      {isRegenning
        ? <p className="cs-field-regen">Regenerating…</p>
        : children || <p className="cs-field-body">{value || "—"}</p>
      }
      {showPhil && philNote && <div className="phil-note">{philNote}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WORLD HUB
═══════════════════════════════════════════════════════════════════════════ */
function WorldHub({ worlds, onSelectWorld, onNewWorld }) {
  return (
    <div className="screen" style={{ paddingBottom: "5rem" }}>
      <div className="page-head">
        <span className="t-eyebrow">Aristotelian</span>
        <h1 className="t-display">Your Worlds</h1>
      </div>
      <div className="divider" />
      {worlds.length === 0
        ? <EmptyState
            quote='"A character who has no real choices is not a character. They are a prop."'
            body="Create a world to begin. Every character you forge will be shaped by its tone, rules, and history."
          />
        : <div style={{ display:"flex", flexDirection:"column", gap:".85rem", paddingTop:"1.5rem" }}>
            {worlds.map((w, i) => (
              <div key={w.id} style={{ animation:`fadeUp .4s ${i*.06}s ease both` }}>
                <div className="card" onClick={() => onSelectWorld(w.id)}>
                  <div className="card-top">
                    <span className="card-name">{w.name}</span>
                    <span className="card-badge">{w.characters.length === 0 ? "Empty" : `${w.characters.length} character${w.characters.length !== 1 ? "s" : ""}`}</span>
                  </div>
                  <p className="card-desc">{w.description}</p>
                  <span className="card-cta">Enter →</span>
                </div>
              </div>
            ))}
          </div>
      }
      <BottomBar>
        <button className="btn btn-primary" onClick={onNewWorld}>+ New World</button>
      </BottomBar>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CREATE WORLD
═══════════════════════════════════════════════════════════════════════════ */
function CreateWorldScreen({ onBack, onCreate }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState(PLACEHOLDER_DESC);
  const [errors, setErrors] = useState({});

  const submit = () => {
    const e = {};
    if (!name.trim()) e.name = "A world needs a name.";
    if (!desc.trim()) e.desc = "Describe the tone, genre, feel.";
    if (Object.keys(e).length) { setErrors(e); return; }
    onCreate({ id: uid(), name: name.trim(), description: desc.trim(), characters: [] });
  };

  return (
    <div className="screen" style={{ paddingBottom:"5rem" }}>
      <div className="page-head">
        <div className="page-head-nav"><button className="back-btn" onClick={onBack}>← Worlds</button></div>
        <span className="t-eyebrow">New World</span>
        <h1 className="t-heading">Name your world</h1>
        <p className="t-body">Every character inherits this context. Tone matters more than detail.</p>
      </div>
      <div className="divider" />
      <div className="form-stack">
        <div>
          <label className="f-label">World name</label>
          <input className="f-input" placeholder="The Broken Coast, Neo-Tokyo 2187…"
            value={name} onChange={e => { setName(e.target.value); setErrors(p => ({...p,name:null})); }} maxLength={60} />
          {errors.name && <p style={{fontSize:".75rem",color:"var(--dust)",marginTop:".3rem"}}>{errors.name}</p>}
        </div>
        <div>
          <label className="f-label">Description</label>
          <textarea className="f-area" rows={6} placeholder="Genre, tone, rules, history, feel…"
            value={desc} onChange={e => { setDesc(e.target.value); setErrors(p => ({...p,desc:null})); }} maxLength={600} />
          <div style={{display:"flex",justifyContent:"space-between",marginTop:".3rem"}}>
            {errors.desc ? <p style={{fontSize:".75rem",color:"var(--dust)"}}>{errors.desc}</p> : <span/>}
            <span className="t-hint">{desc.length} / 600</span>
          </div>
        </div>
      </div>
      <BottomBar>
        <button className="btn btn-primary" onClick={submit}>Create World</button>
        <button className="btn btn-ghost" onClick={onBack}>Cancel</button>
      </BottomBar>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WORLD DETAIL
═══════════════════════════════════════════════════════════════════════════ */
function WorldDetail({ world, onBack, onSelectCharacter, onNewCharacter }) {
  return (
    <div className="screen" style={{ paddingBottom:"5rem" }}>
      <div className="page-head">
        <div className="page-head-nav"><button className="back-btn" onClick={onBack}>← Aristotelian</button></div>
        <h1 className="t-heading">{world.name}</h1>
        <p className="t-body">{world.description}</p>
      </div>
      <div className="divider" />
      {world.characters.length === 0
        ? <EmptyState
            quote='"Without action there cannot be a tragedy; there may be one without character."'
            body="No characters yet. Give the LLM a pitch, a name, or nothing at all."
          />
        : <div style={{ display:"flex", flexDirection:"column", gap:".85rem", paddingTop:"1.5rem" }}>
            {world.characters.map((c, i) => {
              const meta = metaLine(c);
              return (
                <div key={c.id} style={{ animation:`fadeUp .4s ${i*.06}s ease both` }}>
                  <div className="card" onClick={() => onSelectCharacter(c.id)}>
                    <div className="card-top">
                      <span className="card-name">{c.name || "Unnamed"}</span>
                      {meta && <span className="card-badge">{meta}</span>}
                    </div>
                    {c.role && <span className="card-role-line">{c.role}</span>}
                    {c.quote && <p className="card-quote">"{c.quote}"</p>}
                    <span className="card-cta">View character →</span>
                  </div>
                </div>
              );
            })}
          </div>
      }
      <BottomBar>
        <button className="btn btn-primary" onClick={onNewCharacter}>+ New Character</button>
      </BottomBar>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CREATE CHARACTER
═══════════════════════════════════════════════════════════════════════════ */
function CreateCharacterScreen({ world, onBack, onStartGenerating, onGenerated, onError, onChunk }) {
  const [pitch, setPitch]       = useState("");
  const [role, setRole]         = useState("");
  const [style, setStyle]       = useState("");
  const [targetLeadId, setTargetLeadId] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [f, setF] = useState({
    name:"", age:"", gender:"", race:"",
    appearance:"", clothing:"", details:"",
    background:"", personality:"", desires:"", fears:"", moralCore:"",
  });
  const upd = k => e => setF(p => ({...p, [k]: e.target.value}));

  const leads = world.characters.filter(c => c.role === "Lead");
  const targetLead = leads.find(c => c.id === targetLeadId) || null;

  const generate = async () => {
    onStartGenerating();
    try {
      const raw = await callClaudeStreaming(
        buildPrompt(world, world.characters, { role, style, pitch, ...f }, targetLead),
        "Generate the character.",
        2000,
        onChunk
      );
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      onGenerated({ id: uid(), worldId: world.id, pitch, ...parsed });
    } catch (err) {
      onError(err.message?.includes("JSON")
        ? "The model returned something unexpected. Try again."
        : "Something went wrong. Check your connection and try again."
      );
    }
  };

  return (
    <div className="screen" style={{ paddingBottom:"5rem" }}>
      <div className="page-head">
        <div className="page-head-nav"><button className="back-btn" onClick={onBack}>← {world.name}</button></div>
        <span className="t-eyebrow">New Character</span>
        <h1 className="t-heading">Your concept</h1>
        <p className="t-body">A word or a page — anything left blank will be shaped by Aristotle's framework and your world.</p>
      </div>
      <div className="divider" />

      <div className="form-stack">
        <div>
          <label className="f-label">Idea / Pitch</label>
          <textarea className="f-area" rows={4}
            placeholder="A disgraced accountant who knows too much about the wrong people's money…"
            value={pitch} onChange={e => setPitch(e.target.value)} />
        </div>

        <PillSelect
          label="Role"
          options={ROLE_OPTIONS}
          value={role}
          onChange={setRole}
          hint={role ? ROLE_OPTIONS.find(o => o.value === role)?.desc : "Leave blank — the LLM will choose"}
        />

        {role === "Deuteragonist" && leads.length > 0 && (
          <div>
            <label className="f-label">Target Lead</label>
            <select className="f-input" value={targetLeadId} onChange={e => setTargetLeadId(e.target.value)}>
              <option value="">— Let LLM decide</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        )}

        <PillSelect
          label="Style"
          options={STYLE_OPTIONS}
          value={style}
          onChange={setStyle}
          hint={style ? STYLE_OPTIONS.find(o => o.value === style)?.desc : "Leave blank — the LLM will choose"}
        />

        <button className="toggle-btn" onClick={() => setShowMore(p => !p)}>
          {showMore ? "− Hide optional fields" : "+ Add specifics (optional)"}
        </button>

        {showMore && <>
          <span className="s-label">Identity</span>
          <div><label className="f-label">Name</label><input className="f-input" placeholder="Leave blank to generate" value={f.name} onChange={upd("name")} /></div>
          <div className="f-row">
            <div><label className="f-label">Age</label><input className="f-input" placeholder="Mid 40s…" value={f.age} onChange={upd("age")} /></div>
            <div><label className="f-label">Gender</label><input className="f-input" placeholder="Open" value={f.gender} onChange={upd("gender")} /></div>
          </div>
          <div><label className="f-label">Race / Species</label><input className="f-input" placeholder="Interpreted by world context" value={f.race} onChange={upd("race")} /></div>

          <span className="s-label">Physical</span>
          <div><label className="f-label">Appearance</label><textarea className="f-area" rows={2} placeholder="Physical traits…" value={f.appearance} onChange={upd("appearance")} /></div>
          <div><label className="f-label">Clothing</label><textarea className="f-area" rows={2} placeholder="Style, garments…" value={f.clothing} onChange={upd("clothing")} /></div>
          <div><label className="f-label">Details</label><textarea className="f-area" rows={2} placeholder="Scars, mannerisms, voice…" value={f.details} onChange={upd("details")} /></div>

          <span className="s-label">Psychology</span>
          <div><label className="f-label">Background</label><textarea className="f-area" rows={2} placeholder="Origin, history…" value={f.background} onChange={upd("background")} /></div>
          <div><label className="f-label">Personality</label><textarea className="f-area" rows={2} placeholder="Behavioral patterns…" value={f.personality} onChange={upd("personality")} /></div>
          <div><label className="f-label">Desires</label><input className="f-input" placeholder="What they want on the surface" value={f.desires} onChange={upd("desires")} /></div>
          <div><label className="f-label">Fears</label><input className="f-input" placeholder="What haunts them" value={f.fears} onChange={upd("fears")} /></div>
          <div><label className="f-label">Moral Core</label><textarea className="f-area" rows={2} placeholder="What they'd protect at cost…" value={f.moralCore} onChange={upd("moralCore")} /></div>
        </>}
      </div>

      <BottomBar>
        <button className="btn btn-primary" onClick={generate}>Generate Character</button>
        <button className="btn btn-ghost" onClick={onBack}>Cancel</button>
      </BottomBar>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHARACTER SHEET — tabs
═══════════════════════════════════════════════════════════════════════════ */
function CharacterSheet({ character, world, onBack, onUpdate, onExpand, isExpanding }) {
  const [tab, setTab]           = useState("overview");
  const [regenningKey, setRegenningKey] = useState(null);
  const [regenError, setRegenError]     = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const meta  = metaLine(character);
  const role  = character.role  || "";
  const style = character.style || "";
  const mini  = isMini(role);
  const supp  = isSupport(role);
  const full  = isFullRole(role);

  const availableTabs = [
    { id: "overview",     label: "Overview" },
    { id: "identity",     label: "Identity" },
    ...((full || supp) ? [{ id: "psychology", label: "Psychology" }] : []),
    { id: "dialogue",     label: "Dialogue" },
    { id: "aristotelian", label: "Aristotelian" },
  ];

  const regen = async (fieldKey) => {
    setRegenningKey(fieldKey);
    setRegenError(null);
    const sys = `Regenerate one field for an existing character.
WORLD: ${world.name} — ${world.description}
CHARACTER: ${JSON.stringify(character)}
TASK: Regenerate only the "${fieldKey}" field. Stay consistent with all other fields. Apply Aristotle's framework.
Return ONLY the new value as a plain string. No JSON. No labels.`;
    try {
      const text = await callClaude(sys, `Regenerate ${fieldKey}.`, 500);
      onUpdate({ ...character, [fieldKey]: text.trim() });
    } catch {
      setRegenError(`Couldn't regenerate. Tap ↻ to try again.`);
      setTimeout(() => setRegenError(null), 5000);
    } finally {
      setRegenningKey(null);
    }
  };

  const F = (label, key, phil) => (
    <CharField label={label} value={character[key]} fieldKey={key}
      onRegen={regen} regenningKey={regenningKey} philNote={phil ? PHIL[phil] : null} />
  );

  const LockedSection = ({ title, fields }) => (
    <div className="cs-section">
      <div className="cs-section-title">{title}</div>
      {fields.map(([label, key]) => (
        <div key={key} className="locked-field">
          <span className="locked-label">{label}</span>
          {character[key]
            ? <p className="cs-field-body">{character[key]}</p>
            : <span className="locked-msg">Not generated — expand this character to unlock.</span>
          }
        </div>
      ))}
      {!character.hamartia && (
        <button className="btn btn-sage" onClick={onExpand} disabled={isExpanding} style={{marginTop:".5rem"}}>
          {isExpanding ? "Expanding…" : "✦ Expand Character"}
        </button>
      )}
    </div>
  );

  return (
    <div className="screen" style={{ paddingBottom:"3rem" }}>
      {/* Header — always visible */}
      <div className="char-header">
        <button className="back-btn" onClick={onBack}>← {world.name}</button>
        <h1 className="char-name">{character.name || "Unnamed"}</h1>
        {character.role && <p className="char-role">{character.role}</p>}
        {(meta || style || role) && (
          <div style={{ display:"flex", flexDirection:"column", gap:".35rem" }}>
            {meta && <span className="char-meta">{meta}</span>}
            <div className="char-tags">
              {role  && <span className="char-tag">{role}</span>}
              {style && <span className="char-tag sage">{style}</span>}
            </div>
          </div>
        )}
        {character.summary?.filter(Boolean).length > 0 && (
          <ul className="char-summary">
            {character.summary.filter(Boolean).map((s, i) => (
              <li key={i} className="char-summary-item">{s}</li>
            ))}
          </ul>
        )}
        {character.quote && <p className="char-quote">"{character.quote}"</p>}
      </div>
      <div className="divider" />

      {regenError && <div style={{paddingTop:"1rem"}}><ErrorToast message={regenError} /></div>}

      {/* Tab bar */}
      <div className="tab-bar" style={{ marginTop:"1rem" }}>
        {availableTabs.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="cs-section">
          {F("Consistency", "consistency", "consistency")}
          {F("Moral Core",  "moralCore",   "moralCore")}
          {character.aristotelianNote && <>
            <button className="analysis-toggle" onClick={() => setShowAnalysis(p => !p)}>
              <span className="analysis-label">Aristotelian Analysis</span>
              <span style={{fontSize:".75rem",color:"var(--amber)"}}>{showAnalysis ? "▴" : "▾"}</span>
            </button>
            {showAnalysis && <p className="analysis-body">{character.aristotelianNote}</p>}
          </>}
        </div>
      )}

      {/* Identity tab */}
      {tab === "identity" && (
        <div className="cs-section">
          {F("Appearance", "appearance", "appearance")}
          {F("Clothing",   "clothing",   null)}
          {F("Details",    "details",    null)}
          {F("Background", "background", null)}
        </div>
      )}

      {/* Psychology tab */}
      {tab === "psychology" && (
        <>
          {(full) && (
            <div className="cs-section">
              {F("Personality", "personality", "personality")}
              {F("Desires",     "desires",     "desires")}
              {F("Fears",       "fears",       "fears")}
              {F("Hamartia",    "hamartia",    "hamartia")}
              {role === "Ensemble" && character.collectiveHamartia && (
                <CharField label="Collective Hamartia" value={character.collectiveHamartia}
                  fieldKey="collectiveHamartia" onRegen={regen} regenningKey={regenningKey} />
              )}
            </div>
          )}
          {supp && (
            <>
              <div className="cs-section">
                {F("Personality", "personality", "personality")}
                {F("Desires",     "desires",     "desires")}
                {F("Fears",       "fears",       "fears")}
              </div>
              <LockedSection title="Aristotelian Core (locked)"
                fields={[["Hamartia","hamartia"],["Consistency","consistency"]]} />
            </>
          )}
        </>
      )}

      {/* Dialogue tab */}
      {tab === "dialogue" && (
        <div className="cs-section">
          <div className="cs-section-title">Dialogue</div>
          {character.speechMode
            ? <div className="cs-field">
                <div className="cs-field-head">
                  <span className="cs-field-label">Speech Mode</span>
                  <div className="cs-field-actions">
                    <button className="icon-btn" onClick={() => regen("speechMode")} disabled={!!regenningKey}>
                      {regenningKey === "speechMode" ? "…" : "↻"}
                    </button>
                  </div>
                </div>
                <span className="cs-speech-tag">{character.speechMode}</span>
              </div>
            : null
          }
          {F("Under Pressure", "underPressure", "underPressure")}
          {F("Subtext",        "subtext",       "subtext")}
          {F("Voice Pattern",  "voicePattern",  "voicePattern")}
          {(!character.underPressure && !character.subtext && !character.voicePattern) && (
            <div style={{paddingTop:".5rem"}}>
              <button className="btn btn-sage" onClick={onExpand} disabled={isExpanding}>
                {isExpanding ? "Expanding…" : "✦ Generate Dialogue"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Aristotelian tab */}
      {tab === "aristotelian" && (
        <div className="cs-section">
          {full && F("Hamartia", "hamartia", "hamartia")}
          {character.relationships?.length > 0 && <>
            <div className="cs-section-title" style={{marginTop:".5rem"}}>Relationships</div>
            {character.relationships.map((r, i) => (
              <div key={i} className="rel-entry">
                <span className="rel-name">{r.characterName}</span>
                <span className="rel-desc">{r.description}</span>
              </div>
            ))}
          </>}
          {character.aristotelianNote && <>
            <div className="cs-section-title" style={{marginTop:".5rem"}}>Analysis</div>
            <p className="analysis-body" style={{paddingTop:".25rem"}}>{character.aristotelianNote}</p>
          </>}
          {(!full) && (
            <LockedSection title="Full Aristotelian Treatment"
              fields={[["Hamartia","hamartia"],["Aristotelian Note","aristotelianNote"]]} />
          )}
        </div>
      )}

      <div style={{height:"2rem"}} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [view, setView]               = useState("hub");
  const [activeWorldId, setActiveWorldId] = useState(null);
  const [activeCharId,  setActiveCharId]  = useState(null);
  const [worlds, setWorlds]           = useState([]);
  const [loaded, setLoaded]           = useState(false);
  const [justSaved, setJustSaved]     = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [expanding, setExpanding]     = useState(false);
  const [genError, setGenError]       = useState(null);
  const [genAccumulated, setGenAccumulated] = useState("");

  const { phaseIdx, doneIds, verb, justDone } = useGeneratingProgress(generating, genAccumulated);

  const activeWorld = worlds.find(w => w.id === activeWorldId);
  const activeChar  = activeWorld?.characters.find(c => c.id === activeCharId);

  // Load
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r?.value) setWorlds(JSON.parse(r.value));
      } catch (_) {}
      setLoaded(true);
    })();
  }, []);

  // Save
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify(worlds));
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1200);
      } catch (_) {}
    })();
  }, [worlds, loaded]);

  const addWorld      = w  => setWorlds(p => [...p, w]);
  const addCharacter  = c  => setWorlds(p => p.map(w => w.id === activeWorldId ? {...w, characters:[...w.characters,c]} : w));
  const updateCharacter = c => setWorlds(p => p.map(w => w.id === activeWorldId ? {...w, characters:w.characters.map(x => x.id===c.id?c:x)} : w));

  const handleStartGenerating = () => { setGenerating(true); setGenError(null); setGenAccumulated(""); };
  const handleGenerated = (char) => { setGenerating(false); addCharacter(char); setActiveCharId(char.id); setView("character"); };
  const handleGenError  = (msg)  => { setGenerating(false); setGenError(msg); };

  const handleExpand = async () => {
    if (!activeChar || !activeWorld) return;
    setExpanding(true);
    try {
      const raw    = await callClaude(buildExpandPrompt(activeWorld, activeChar), "Expand this character.");
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      updateCharacter({ ...activeChar, ...parsed });
    } catch (err) {
      console.error("Expand failed", err);
    } finally {
      setExpanding(false);
    }
  };

  if (!loaded) return (
    <>
      <style>{STYLES}</style>
      <div className="ambient" />
      <div className="app">
        <div className="screen" style={{paddingTop:"4rem",textAlign:"center"}}>
          <p className="t-body">Loading…</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="ambient" />

      {justSaved && (
        <div className="save-indicator">
          <span className="t-eyebrow" style={{color:"var(--sage)"}}>Saved</span>
          <span className="save-dot" />
        </div>
      )}

      {generating && <GeneratingOverlay phaseIdx={phaseIdx} doneIds={doneIds} verb={verb} justDone={justDone} />}

      <div className="app">
        {view === "hub" && (
          <WorldHub
            worlds={worlds}
            onSelectWorld={id => { setActiveWorldId(id); setView("world"); }}
            onNewWorld={() => setView("createWorld")}
          />
        )}
        {view === "createWorld" && (
          <CreateWorldScreen
            onBack={() => setView("hub")}
            onCreate={w => { addWorld(w); setActiveWorldId(w.id); setView("world"); }}
          />
        )}
        {view === "world" && activeWorld && (
          <WorldDetail
            world={activeWorld}
            onBack={() => setView("hub")}
            onSelectCharacter={id => { setActiveCharId(id); setView("character"); }}
            onNewCharacter={() => { setGenError(null); setView("createCharacter"); }}
          />
        )}
        {view === "createCharacter" && activeWorld && (
          <>
            <CreateCharacterScreen
              world={activeWorld}
              onBack={() => setView("world")}
              onStartGenerating={handleStartGenerating}
              onGenerated={handleGenerated}
              onError={handleGenError}
              onChunk={setGenAccumulated}
            />
            {genError && (
              <div style={{position:"fixed",bottom:"7rem",left:"1.25rem",right:"1.25rem",zIndex:500,maxWidth:"420px",margin:"0 auto"}}>
                <ErrorToast message={genError} onRetry={() => setGenError(null)} />
              </div>
            )}
          </>
        )}
        {view === "character" && activeChar && activeWorld && (
          <CharacterSheet
            character={activeChar}
            world={activeWorld}
            onBack={() => setView("world")}
            onUpdate={updateCharacter}
            onExpand={handleExpand}
            isExpanding={expanding}
          />
        )}
      </div>
    </>
  );
}
