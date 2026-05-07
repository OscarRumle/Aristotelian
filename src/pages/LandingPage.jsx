import { useAuth } from "../context/AuthContext.jsx";

const features = [
  { icon: "⊕", title: "Hamartia, not flaw lists", body: "The fatal flaw isn't a weakness — it's the specific error that emerges from the character's greatest strength. Oedipus's curiosity makes him a great king and destroys him." },
  { icon: "◈", title: "AI-driven world interview", body: "Describe your world. Claude interviews it through Aristotle's five analytical lenses and generates a complete lore bible from your answers." },
  { icon: "◉", title: "Dramatic role system", body: "Lead, Deuteragonist, Supporting, Minor, Ensemble. A Deuteragonist's hamartia must interlock with a Lead's. A Supporting character exists to reveal someone else." },
  { icon: "◎", title: "World documents feed characters", body: "Every character you generate inherits your world's lore bible. The power structures, the social contract, the world's own hamartia — all of it shapes who the character can be." },
  { icon: "⊞", title: "The four requirements", body: "Goodness, Appropriateness, Likeness to Truth, Consistency — first-class fields, not afterthoughts. Characters that satisfy them feel inevitable rather than constructed." },
  { icon: "⊟", title: "Field regeneration with feedback", body: "Disagree with a generated field? Regenerate it with a note — 'make the hamartia more subtle', 'this feels too tragic'. Each field is independently editable." },
];

const steps = [
  { n: "01", t: "Name your world", b: "Give it a name and a pitch. Tone matters more than detail — the LLM reads between the lines." },
  { n: "02", t: "Run the Aristotelian interview", b: "Choose Short (5 questions) or Long (20). Claude asks targeted questions, then synthesises a lore bible." },
  { n: "03", t: "Generate characters", b: "Each character inherits the world. The AI applies Aristotle's four requirements and assigns role-appropriate structure." },
  { n: "04", t: "Refine and expand", b: "Regenerate individual fields with feedback. Expand Supporting characters into full dramatic arcs. Your cast becomes a system, not a list." },
];

export function LandingPage({ navigate }) {
  const { setLoginOpen, user } = useAuth();
  const startFree = () => user ? navigate("design") : setLoginOpen(true);
  const openApp = () => navigate("design");

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="lp-root">
      <section className="lp-hero">
        <div className="lp-container">
          <p className="lp-eyebrow">Aristotle's Poetics · AI Character Studio</p>
          <h1 className="lp-h1">Every character<br />contains their undoing.</h1>
          <p className="lp-sub">
            An AI writing tool built on Aristotle's <em>Poetics</em>. Create characters with genuine dramatic structure — hamartia, moral core, and the specific error that emerges from their greatest strength.
          </p>
          <div className="lp-hero-cta">
            <button className="btn btn-primary" onClick={startFree}>Start building free</button>
            <button className="btn btn-ghost" onClick={() => scrollTo("how")}>See how it works</button>
          </div>
          <p className="lp-quote">
            "A likely impossibility is always preferable to an unconvincing possibility."
            <span className="src">— Aristotle, Poetics</span>
          </p>
        </div>
      </section>

      <section id="features" className="lp-section">
        <div className="lp-container">
          <p className="lp-section-label">Features</p>
          <h2 className="lp-section-h">Structure that makes<br />characters feel inevitable</h2>
          <div className="lp-grid">
            {features.map(f => (
              <div key={f.title} className="lp-fc">
                <span className="lp-fc-icon">{f.icon}</span>
                <h3 className="lp-fc-title">{f.title}</h3>
                <p className="lp-fc-body">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="lp-section">
        <div className="lp-container">
          <p className="lp-section-label">How it works</p>
          <h2 className="lp-section-h">From world concept<br />to dramatic ensemble</h2>
          <div style={{ marginTop: "4rem" }}>
            {steps.map(s => (
              <div key={s.n} className="lp-step">
                <span className="lp-step-n">{s.n}</span>
                <div>
                  <h3 className="lp-step-t">{s.t}</h3>
                  <p className="lp-step-b">{s.b}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "3.5rem" }}>
            <button className="btn btn-primary" onClick={startFree}>Open the studio</button>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <span className="lp-footer-brand">Aristotelian</span>
          <p className="lp-footer-meta">Built on Aristotle's Poetics · Powered by Claude</p>
          <button className="lp-footer-link" onClick={openApp}>Open App →</button>
        </div>
      </footer>
    </div>
  );
}
