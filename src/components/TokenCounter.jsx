import { useState, useEffect } from "react";
import { getTokenUsage, resetTokenUsage } from "../api/claude.js";

const INPUT_PRICE_PER_M  = 3.00;   // USD / million input tokens  (Sonnet 4.6)
const OUTPUT_PRICE_PER_M = 15.00;  // USD / million output tokens
const USD_TO_DKK = 6.89;

function calcCost({ input, output }) {
  return (input / 1_000_000) * INPUT_PRICE_PER_M
       + (output / 1_000_000) * OUTPUT_PRICE_PER_M;
}

export function TokenCounter() {
  const [visible, setVisible] = useState(true);
  const [usage, setUsage] = useState(getTokenUsage);

  useEffect(() => {
    const handler = (e) => setUsage(e.detail);
    window.addEventListener("tokenusage", handler);
    return () => window.removeEventListener("tokenusage", handler);
  }, []);

  const costUsd = calcCost(usage);
  const costDkk = costUsd * USD_TO_DKK;
  const total   = usage.input + usage.output;

  if (!visible) {
    return (
      <button className="token-counter-pill" onClick={() => setVisible(true)} title="Show token usage">
        ◈ tokens
      </button>
    );
  }

  return (
    <div className="token-counter">
      <div className="token-counter-head">
        <span className="token-counter-label">Token usage</span>
        <button className="token-counter-hide" onClick={() => setVisible(false)} title="Hide">✕</button>
      </div>

      <div className="token-counter-rows">
        <div className="token-counter-row">
          <span className="token-counter-key">in</span>
          <span className="token-counter-val">{usage.input.toLocaleString()}</span>
        </div>
        <div className="token-counter-row">
          <span className="token-counter-key">out</span>
          <span className="token-counter-val">{usage.output.toLocaleString()}</span>
        </div>
        <div className="token-counter-row token-counter-total">
          <span className="token-counter-key">total</span>
          <span className="token-counter-val">{total.toLocaleString()}</span>
        </div>
      </div>

      <div className="token-counter-cost">
        <span>${costUsd.toFixed(4)}</span>
        <span className="token-counter-sep">·</span>
        <span>{costDkk.toFixed(2)} kr</span>
      </div>

      <button className="token-counter-reset" onClick={resetTokenUsage}>Reset</button>
    </div>
  );
}
