import { useState } from "react";

const C = {
  bg: "#F4EDE4",
  surface: "#FDF8F0",
  card: "rgba(253,250,246,.97)",
  border: "rgba(184,149,106,.2)",
  borderHover: "rgba(184,149,106,.5)",
  amber: "#B8956A",
  sage: "#7B9E80",
  dust: "#C4806A",
  text: "#2B2018",
  muted: "#9A8C85",
  faint: "#B0A49C",
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'Jost', system-ui, sans-serif",
};

const s = {
  page: { background: C.bg, color: C.text, fontFamily: C.sans, minHeight: "100vh", overflowX: "hidden" },
  container: { maxWidth: 960, margin: "0 auto", padding: "0 2rem" },
  section: (pt = "7rem", pb = "7rem") => ({ paddingTop: pt, paddingBottom: pb }),
};

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(244,237,228,.92)", backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ ...s.container, display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <span style={{ fontFamily: C.serif, fontStyle: "italic", fontWeight: 300, fontSize: "1.2rem", color: C.text }}>
          Aristotelian
        </span>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <a href="#features" style={linkStyle}>Features</a>
          <a href="#how" style={linkStyle}>How it works</a>
          <a href="#plans" style={linkStyle}>Pricing</a>
          <a href="/" style={{
            fontFamily: C.serif, fontStyle: "italic", fontWeight: 300, fontSize: "1rem",
            color: C.surface, background: C.amber,
            padding: ".42rem 1.35rem", borderRadius: 4, textDecoration: "none",
            transition: "opacity .15s",
          }}>
            Open App
          </a>
        </div>
      </div>
    </nav>
  );
}

const linkStyle = {
  fontFamily: C.sans, fontSize: ".7rem", fontWeight: 400, letterSpacing: ".1em",
  textTransform: "uppercase", color: C.faint, textDecoration: "none", transition: "color .15s",
};

// ── Sample character card ─────────────────────────────────────────────────────

function SampleCharacterCard() {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
      padding: "1.5rem 1.75rem", maxWidth: 400, margin: "3.5rem auto 0",
      textAlign: "left", boxShadow: "0 8px 48px rgba(60,40,20,.08)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: ".75rem" }}>
        <div>
          <span style={{ fontFamily: C.serif, fontSize: "1.55rem", fontWeight: 300, color: C.text, display: "block", lineHeight: 1.1 }}>
            Maren Solis
          </span>
          <span style={{ fontFamily: C.sans, fontSize: ".62rem", color: C.faint, letterSpacing: ".12em", textTransform: "uppercase" }}>
            Lead · Tragic
          </span>
        </div>
        <span style={{
          fontFamily: C.sans, fontSize: ".58rem", color: C.amber,
          background: "rgba(184,149,106,.1)", border: `1px solid rgba(184,149,106,.25)`,
          padding: ".2rem .65rem", borderRadius: 20, letterSpacing: ".1em", textTransform: "uppercase",
          whiteSpace: "nowrap", flexShrink: 0, marginLeft: ".75rem",
        }}>
          AI generated
        </span>
      </div>

      <p style={{ fontFamily: C.serif, fontStyle: "italic", color: C.amber, fontSize: "1rem", lineHeight: 1.55, marginBottom: "1.1rem" }}>
        "I know what she did. I know exactly what I'm doing."
      </p>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1rem" }}>
        <span style={{
          fontFamily: C.sans, fontSize: ".6rem", fontWeight: 500,
          letterSpacing: ".16em", textTransform: "uppercase",
          color: C.faint, display: "block", marginBottom: ".35rem",
        }}>
          Hamartia
        </span>
        <p style={{ fontFamily: C.sans, fontSize: ".83rem", color: C.muted, lineHeight: 1.75, margin: 0 }}>
          Her relentless compassion — the quality that makes her an exceptional surgeon —
          is the same force that makes her bury evidence to protect a colleague.
          The virtue and the error are one thing.
        </p>
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section style={{ ...s.section("10rem", "7rem"), textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
        width: 800, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(184,149,106,.07) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <div style={s.container}>
        <p style={{
          fontFamily: C.sans, fontSize: ".67rem", fontWeight: 500, letterSpacing: ".22em",
          textTransform: "uppercase", color: C.amber, marginBottom: "1.5rem",
        }}>
          Aristotle's Poetics · AI Character Forge
        </p>

        <h1 style={{
          fontFamily: C.serif, fontStyle: "italic", fontWeight: 300,
          fontSize: "clamp(2.8rem, 7vw, 5.5rem)", lineHeight: 1.1,
          color: C.text, marginBottom: "1.25rem", letterSpacing: "-.01em",
        }}>
          Every character<br />contains their undoing.
        </h1>

        <p style={{
          fontFamily: C.sans, fontWeight: 400, fontSize: ".7rem",
          letterSpacing: ".14em", textTransform: "uppercase",
          color: C.faint, marginBottom: "1.75rem",
        }}>
          For novelists · Screenwriters · Game designers · World-builders
        </p>

        <p style={{
          fontFamily: C.sans, fontWeight: 300, fontSize: "clamp(.92rem, 2vw, 1.05rem)",
          color: C.muted, maxWidth: 540, margin: "0 auto 2.75rem", lineHeight: 1.85,
        }}>
          An AI writing tool built on Aristotle's <em style={{ fontFamily: C.serif, fontStyle: "italic", color: C.text }}>Poetics</em>.
          Generate characters with genuine dramatic structure — hamartia, moral core, and the specific
          error that emerges from their greatest strength. Not a list of traits. A dramatic engine.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/" style={{
            fontFamily: C.serif, fontStyle: "italic", fontWeight: 300, fontSize: "1.1rem",
            color: C.surface, background: C.amber,
            padding: ".72rem 2.25rem", borderRadius: 4,
            textDecoration: "none", display: "inline-block", transition: "opacity .15s",
          }}>
            Start building free
          </a>
          <a href="#how" style={{
            fontFamily: C.serif, fontStyle: "italic", fontWeight: 300, fontSize: "1.1rem",
            color: C.muted, background: "transparent",
            padding: ".72rem 2rem", borderRadius: 4,
            textDecoration: "none", border: `1px solid ${C.border}`,
            display: "inline-block", transition: "border-color .15s",
          }}>
            See how it works
          </a>
        </div>

        <SampleCharacterCard />

        <p style={{
          fontFamily: C.serif, fontStyle: "italic", fontWeight: 300,
          fontSize: ".95rem", color: C.faint, marginTop: "4rem",
          letterSpacing: ".02em",
        }}>
          "A likely impossibility is always preferable to an unconvincing possibility."
          <br />
          <span style={{ fontFamily: C.sans, fontStyle: "normal", fontSize: ".62rem", letterSpacing: ".15em", textTransform: "uppercase" }}>
            — Aristotle, Poetics
          </span>
        </p>
      </div>
    </section>
  );
}

// ── Audience strip ────────────────────────────────────────────────────────────

function AudienceStrip() {
  const audiences = ["Novelists", "Screenwriters", "Game Designers", "World-Builders", "Dungeon Masters", "Narrative Designers"];
  return (
    <div style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "1.4rem 0", background: C.surface }}>
      <div style={{ ...s.container, display: "flex", justifyContent: "center", gap: ".5rem 2rem", flexWrap: "wrap", alignItems: "center" }}>
        {audiences.map((a) => (
          <span key={a} style={{ fontFamily: C.sans, fontSize: ".67rem", fontWeight: 400, letterSpacing: ".14em", textTransform: "uppercase", color: C.faint }}>
            {a}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

const features = [
  {
    icon: "⊕",
    title: "Hamartia, not flaw lists",
    body: "The fatal flaw isn't a weakness — it's the error that emerges from the character's greatest strength. Oedipus's relentless curiosity makes him a great king and destroys him. Every character gets this engine, automatically.",
  },
  {
    icon: "◈",
    title: "AI-driven world interview",
    body: "Describe your world concept in a sentence. Claude runs a Socratic interview through five Aristotelian lenses — Mimesis, Necessity, Polis, Hamartia, The Possible — then synthesises your answers into a full lore bible.",
  },
  {
    icon: "◉",
    title: "Dramatic role system",
    body: "Lead, Deuteragonist, Supporting, Minor, Ensemble — each role changes the depth of generation and the fields shown. A Deuteragonist's hamartia must interlock with a Lead's. A Supporting character exists to reveal someone else.",
  },
  {
    icon: "◎",
    title: "World documents feed characters",
    body: "In Advanced mode, every character inherits your world's lore bible. The power structures, the social contract, the world's own hamartia — all of it shapes who the character can be.",
  },
  {
    icon: "⊞",
    title: "Aristotle's four requirements",
    body: "Goodness, Appropriateness, Likeness to Truth, Consistency — the four requirements from the Poetics are first-class fields, not afterthoughts. Characters that satisfy them feel inevitable rather than constructed.",
  },
  {
    icon: "⊟",
    title: "Field regeneration with feedback",
    body: "Disagree with a generated field? Regenerate it with a note — 'make the hamartia more subtle', 'this feels too tragic'. Or regenerate freely. Each field is independently editable.",
  },
];

function Features() {
  return (
    <section id="features" style={{ ...s.section(), borderTop: `1px solid ${C.border}` }}>
      <div style={s.container}>
        <SectionLabel>What you get</SectionLabel>
        <SectionHeading>Structure that makes<br />characters feel inevitable</SectionHeading>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem", marginTop: "4rem",
        }}>
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, body }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.card : "transparent",
        border: `1px solid ${hov ? C.borderHover : C.border}`,
        borderRadius: 16, padding: "1.75rem 1.5rem",
        transition: "all .2s",
        boxShadow: hov ? "0 4px 24px rgba(60,40,20,.06)" : "none",
      }}
    >
      <span style={{ fontFamily: C.serif, fontSize: "1.5rem", color: C.amber, display: "block", marginBottom: "1rem" }}>{icon}</span>
      <h3 style={{ fontFamily: C.serif, fontWeight: 400, fontSize: "1.2rem", color: C.text, marginBottom: ".65rem", lineHeight: 1.3 }}>{title}</h3>
      <p style={{ fontFamily: C.sans, fontWeight: 300, fontSize: ".85rem", color: C.muted, lineHeight: 1.8, margin: 0 }}>{body}</p>
    </div>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────

const steps = [
  {
    n: "01",
    title: "Name your world",
    body: "Give it a name and a pitch. Tone matters more than detail — the LLM reads between the lines. One sentence or ten, it meets you where you are.",
  },
  {
    n: "02",
    title: "Run the Aristotelian interview",
    body: "Choose Short (5 questions) or Long (20). Claude asks targeted questions through its five analytical lenses, then synthesises your answers into a lore bible: power structures, history, the world's own contradictions.",
  },
  {
    n: "03",
    title: "Generate characters",
    body: "Each character inherits the world's context. The AI applies Aristotle's four requirements and assigns a role-appropriate dramatic structure. Leads get full hamartia arcs. Minor characters get appropriateness and an offscreen life.",
  },
  {
    n: "04",
    title: "Refine and expand",
    body: "Regenerate individual fields with feedback. Expand Supporting characters into full dramatic arcs. Your cast becomes a system — each character defined partly by what they reveal about the others.",
  },
];

function HowItWorks() {
  return (
    <section id="how" style={{ ...s.section(), borderTop: `1px solid ${C.border}` }}>
      <div style={s.container}>
        <SectionLabel>How it works</SectionLabel>
        <SectionHeading>From world concept<br />to dramatic ensemble</SectionHeading>

        <div style={{ display: "flex", flexDirection: "column", gap: "0", marginTop: "4rem" }}>
          {steps.map((step, i) => (
            <div key={step.n} style={{
              display: "flex", gap: "2.5rem", alignItems: "flex-start",
              padding: "2.5rem 0",
              borderBottom: i < steps.length - 1 ? `1px solid ${C.border}` : "none",
            }}>
              <span style={{
                fontFamily: C.serif, fontStyle: "italic", fontSize: "2.5rem", fontWeight: 300,
                color: C.amber, opacity: .45, lineHeight: 1, flexShrink: 0, width: 56,
              }}>{step.n}</span>
              <div>
                <h3 style={{ fontFamily: C.serif, fontWeight: 400, fontSize: "1.35rem", color: C.text, marginBottom: ".5rem" }}>{step.title}</h3>
                <p style={{ fontFamily: C.sans, fontWeight: 300, fontSize: ".88rem", color: C.muted, lineHeight: 1.8, maxWidth: 520, margin: 0 }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Plans ─────────────────────────────────────────────────────────────────────

const plans = [
  {
    name: "Quill",
    price: "Free",
    period: "",
    credits: "20 credits / month",
    tagline: "Try the forge. No card needed.",
    highlight: false,
    included: [
      "20 credits per month",
      "Simple world creation",
      "Up to 3 characters per world",
      "Full character sheet",
      "Field regeneration",
    ],
    excluded: [
      "Advanced world interview",
      "Lore bible generation",
      "World documents",
      "Expand character",
      "Export to PDF / Markdown",
    ],
    cta: "Start free",
    href: "/",
  },
  {
    name: "Writer",
    price: "$12",
    period: "/ month",
    credits: "150 credits / month",
    tagline: "Full Aristotelian toolkit for serious writers.",
    highlight: true,
    included: [
      "150 credits per month",
      "Advanced world interview (5Q or 20Q)",
      "Full lore bible generation",
      "World documents fed into characters",
      "Unlimited worlds and characters",
      "Continue interview (add sessions)",
      "Expand character — full arcs",
      "Field regeneration with feedback",
      "Export to PDF and Markdown",
    ],
    excluded: [
      "Team sharing",
      "API access",
    ],
    cta: "Start writing",
    href: "/",
  },
  {
    name: "Studio",
    price: "$39",
    period: "/ month",
    credits: "600 credits / month",
    tagline: "For writers' rooms, game studios, and prolific world-builders.",
    highlight: false,
    included: [
      "600 credits per month",
      "Everything in Writer",
      "Team sharing (up to 5 seats)",
      "Shared world library",
      "Priority generation",
      "API access for integrations",
      "Usage analytics dashboard",
      "Dedicated support",
    ],
    excluded: [],
    cta: "Contact us",
    href: "mailto:hello@aristotelian.ai",
  },
];

function Plans() {
  return (
    <section id="plans" style={{ ...s.section(), borderTop: `1px solid ${C.border}` }}>
      <div style={s.container}>
        <SectionLabel>Pricing</SectionLabel>
        <SectionHeading>Pay for what you use.<br />Never for what you don't.</SectionHeading>

        <p style={{
          fontFamily: C.sans, fontWeight: 300, fontSize: ".88rem", color: C.muted,
          maxWidth: 480, margin: "1.5rem auto 4rem", textAlign: "center", lineHeight: 1.8,
        }}>
          Credits power every AI operation. 1 credit ≈ one field regeneration.
          A full character costs ~3 credits. An advanced world interview with lore bible costs ~12 credits.
        </p>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.5rem", alignItems: "start",
        }}>
          {plans.map((plan) => <PlanCard key={plan.name} plan={plan} />)}
        </div>

        <p style={{
          fontFamily: C.sans, fontWeight: 300, fontSize: ".75rem", color: C.faint,
          textAlign: "center", marginTop: "3rem", lineHeight: 1.8,
        }}>
          Credits reset monthly. Unused credits don't roll over on Free.
          Need more? Top-up packs available at $0.10 / credit.
        </p>
      </div>
    </section>
  );
}

function PlanCard({ plan }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: plan.highlight ? "rgba(184,149,106,.07)" : C.card,
        border: `1px solid ${plan.highlight ? C.amber : hov ? C.borderHover : C.border}`,
        borderRadius: 20, padding: "2rem 1.75rem",
        position: "relative", transition: "all .2s",
        boxShadow: hov ? "0 6px 32px rgba(60,40,20,.07)" : "none",
      }}
    >
      {plan.highlight && (
        <div style={{
          position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
          background: C.amber, color: C.surface, fontFamily: C.sans, fontSize: ".6rem",
          fontWeight: 500, letterSpacing: ".15em", textTransform: "uppercase",
          padding: ".3rem 1rem", borderRadius: 50,
        }}>Most popular</div>
      )}

      <p style={{ fontFamily: C.sans, fontSize: ".65rem", fontWeight: 500, letterSpacing: ".18em", textTransform: "uppercase", color: C.amber, marginBottom: ".6rem" }}>
        {plan.name}
      </p>
      <div style={{ display: "flex", alignItems: "baseline", gap: ".25rem", marginBottom: ".35rem" }}>
        <span style={{ fontFamily: C.serif, fontSize: "2.8rem", fontWeight: 300, color: C.text, lineHeight: 1 }}>{plan.price}</span>
        {plan.period && <span style={{ fontFamily: C.sans, fontSize: ".8rem", color: C.muted }}>{plan.period}</span>}
      </div>
      <p style={{ fontFamily: C.sans, fontSize: ".75rem", color: C.amber, opacity: .8, marginBottom: ".5rem" }}>{plan.credits}</p>
      <p style={{ fontFamily: C.sans, fontWeight: 300, fontSize: ".82rem", color: C.muted, lineHeight: 1.7, marginBottom: "1.75rem" }}>{plan.tagline}</p>

      <a href={plan.href} style={{
        display: "block", textAlign: "center",
        background: plan.highlight ? C.amber : "transparent",
        color: plan.highlight ? C.surface : C.text,
        border: plan.highlight ? "none" : `1px solid ${C.border}`,
        fontFamily: C.serif, fontStyle: "italic", fontWeight: 300, fontSize: "1.05rem",
        padding: ".65rem 1.5rem", borderRadius: 4,
        textDecoration: "none", marginBottom: "1.75rem", transition: "all .15s",
      }}>
        {plan.cta}
      </a>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1.25rem", display: "flex", flexDirection: "column", gap: ".5rem" }}>
        {plan.included.map((f) => (
          <div key={f} style={{ display: "flex", gap: ".6rem", alignItems: "flex-start" }}>
            <span style={{ color: C.sage, fontSize: ".75rem", flexShrink: 0, marginTop: ".15rem" }}>✓</span>
            <span style={{ fontFamily: C.sans, fontWeight: 300, fontSize: ".8rem", color: C.muted, lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
        {plan.excluded.map((f) => (
          <div key={f} style={{ display: "flex", gap: ".6rem", alignItems: "flex-start" }}>
            <span style={{ color: C.faint, fontSize: ".75rem", flexShrink: 0, marginTop: ".15rem" }}>✕</span>
            <span style={{ fontFamily: C.sans, fontWeight: 300, fontSize: ".8rem", color: C.faint, lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, padding: "3rem 0", background: C.surface }}>
      <div style={{ ...s.container, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <span style={{ fontFamily: C.serif, fontStyle: "italic", fontWeight: 300, fontSize: "1.05rem", color: C.faint }}>Aristotelian</span>
        <p style={{ fontFamily: C.sans, fontWeight: 300, fontSize: ".72rem", color: C.faint, letterSpacing: ".06em" }}>
          Built on Aristotle's Poetics · Powered by Claude
        </p>
        <a href="/" style={{
          fontFamily: C.serif, fontStyle: "italic", fontWeight: 300,
          fontSize: ".95rem", color: C.amber, textDecoration: "none",
        }}>
          Open App →
        </a>
      </div>
    </footer>
  );
}

// ── Section helpers ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: C.sans, fontSize: ".65rem", fontWeight: 500, letterSpacing: ".22em",
      textTransform: "uppercase", color: C.amber, marginBottom: "1.25rem", textAlign: "center",
    }}>
      {children}
    </p>
  );
}

function SectionHeading({ children }) {
  return (
    <h2 style={{
      fontFamily: C.serif, fontStyle: "italic", fontWeight: 300,
      fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.2,
      color: C.text, textAlign: "center", letterSpacing: "-.01em",
    }}>
      {children}
    </h2>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div style={s.page}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #F4EDE4; }
        a:hover { opacity: .82; }
        ::selection { background: rgba(184,149,106,.25); color: #2B2018; }
      `}</style>
      <Nav />
      <main style={{ paddingTop: 60 }}>
        <Hero />
        <AudienceStrip />
        <Features />
        <HowItWorks />
        <Plans />
      </main>
      <Footer />
    </div>
  );
}
