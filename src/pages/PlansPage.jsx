import { useAuth } from "../context/AuthContext.jsx";

const plans = [
  {
    name: "Quill", price: "Free", period: "", credits: "20 credits / month",
    tagline: "Try it free. No card needed.",
    highlight: false,
    included: ["20 credits per month", "Simple world creation", "Up to 3 characters per world", "Full character sheet", "Field regeneration"],
    excluded: ["Advanced world interview", "Lore bible generation", "World documents", "Expand character", "Export to PDF / Markdown"],
    cta: "Start free",
  },
  {
    name: "Writer", price: "$12", period: "/ mo", credits: "150 credits / month",
    tagline: "Full Aristotelian toolkit for serious writers.",
    highlight: true,
    included: ["150 credits per month", "Advanced world interview (5Q or 20Q)", "Full lore bible generation", "World documents fed into characters", "Unlimited worlds and characters", "Continue interview (add sessions)", "Expand character — full arcs", "Field regeneration with feedback", "Export to PDF and Markdown"],
    excluded: ["Team sharing", "API access"],
    cta: "Start writing",
  },
  {
    name: "Studio", price: "$39", period: "/ mo", credits: "600 credits / month",
    tagline: "For writers' rooms, game studios, and prolific world-builders.",
    highlight: false,
    included: ["600 credits per month", "Everything in Writer", "Team sharing (up to 5 seats)", "Shared world library", "Priority generation", "API access for integrations", "Usage analytics dashboard", "Dedicated support"],
    excluded: [],
    cta: "Contact us",
    contact: true,
  },
];

export function PlansPage({ navigate }) {
  const { user, setLoginOpen } = useAuth();
  const start = () => user ? navigate("design") : setLoginOpen(true);

  return (
    <div className="lp-root">
      <section style={{ padding: "5.5rem 0 2rem", textAlign: "center" }}>
        <div className="lp-container">
          <p className="lp-section-label">Pricing</p>
          <h1 className="lp-section-h">Pay for what you use.<br />Never for what you don't.</h1>
          <p style={{ fontFamily: "var(--sans)", fontWeight: 300, fontSize: ".9rem", color: "var(--muted)", maxWidth: 520, margin: "1.75rem auto 0", lineHeight: 1.8 }}>
            Credits power every AI operation. 1 credit ≈ one field regeneration. A full character costs ~3 credits.
            An advanced world interview with lore bible costs ~12 credits.
          </p>
        </div>
      </section>

      <section style={{ padding: "2rem 0 6rem" }}>
        <div className="lp-container">
          <div className="plans-grid">
            {plans.map(p => (
              <div key={p.name} className={`plan ${p.highlight ? "highlight" : ""}`}>
                {p.highlight && <div className="plan-tag">Most popular</div>}
                <p className="plan-name">{p.name}</p>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span className="plan-price">{p.price}</span>
                  {p.period && <span className="plan-period">{p.period}</span>}
                </div>
                <p className="plan-credits">{p.credits}</p>
                <p className="plan-line">{p.tagline}</p>
                <button
                  className={`btn btn-block ${p.highlight ? "btn-primary" : "btn-ghost"}`}
                  style={{ marginBottom: "1.5rem" }}
                  onClick={p.contact ? () => { window.location.href = "mailto:hello@aristotelian.ai"; } : start}
                >
                  {p.cta}
                </button>
                <div className="plan-feats">
                  {p.included.map(f => (
                    <div key={f} className="plan-feat plan-feat-yes">
                      <span className="tick">✓</span><span>{f}</span>
                    </div>
                  ))}
                  {p.excluded.map(f => (
                    <div key={f} className="plan-feat plan-feat-no">
                      <span className="tick">✕</span><span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "var(--sans)", fontWeight: 300, fontSize: ".75rem", color: "var(--faint)", textAlign: "center", marginTop: "3rem", lineHeight: 1.8 }}>
            Credits reset monthly. Unused credits don't roll over on Free.
            Need more? Top-up packs available at $0.10 / credit.
          </p>
        </div>
      </section>
    </div>
  );
}
