import { useState, useEffect } from "react";
import { randItem } from "../util.js";
import { Typewriter } from "./Typewriter.jsx";
import { AnimatedDots } from "./AnimatedDots.jsx";

// Verb sets for each loading context
export const VERBS = {
  interviewQuestions: [
    "Testing the logic…",
    "Reading the social contract…",
    "Tracing what must happen…",
    "Mapping who holds power…",
    "Locating the structural flaw…",
    "Finding the inevitable…",
    "Checking what holds…",
    "Interrogating the polis…",
    "Following the chain of cause…",
    "Probing the foundations…",
    "Naming the irresolvable tension…",
    "Asking what the world forecloses…",
    "Consulting Aristotle…",
    "Measuring the world's hamartia…",
    "Reading what the society rewards…",
    "Testing the rules against the protagonist…",
    "Finding what must happen in 200 years…",
    "Charting the telos…",
  ],
  docGen: [
    "Weaving the lore…",
    "Writing the World Primer…",
    "Mapping the social order…",
    "Naming the irresolvable tension…",
    "Charting the telos…",
    "Binding the history…",
    "Recording the founding myths…",
    "Defining who holds power…",
    "Establishing the rules of the world…",
    "Tracing what must collapse…",
    "Reading what the society punishes…",
    "Rendering the polis…",
    "Setting the world in motion…",
    "Finding the world's hamartia…",
    "Consulting Aristotle's Politics…",
    "Documenting the structural flaw…",
    "Laying the foundations…",
  ],
  expand: [
    "Finding the hamartia…",
    "Deepening the arc…",
    "Naming the flaw…",
    "Consulting the Greeks…",
    "Locating the downfall…",
    "Sharpening the edges…",
    "Reading the soul…",
    "Measuring the grief…",
    "Weighing the virtue…",
    "Following the error…",
  ],
  regen: [
    "Rethinking this…",
    "Finding a sharper truth…",
    "Consulting the Poetics…",
    "Probing the wound…",
    "Reconsidering the arc…",
    "Listening for the subtext…",
    "Searching for consistency…",
    "Weighing the options…",
  ],
  fieldExpand: [
    "Deepening…",
    "Branching…",
    "Digging…",
    "Diverging…",
    "Weaving in…",
    "Extending…",
    "Opening new ground…",
    "Finding the edges…",
  ],
};

/**
 * Cycling animated verb with typewriter effect.
 * compact=true: inline, no subtitle, smaller text — for field-level loading states.
 * compact=false (default): centered block with optional subtitle — for full-screen/step loading.
 */
export function AnimatedVerbs({ verbs, subtitle, compact = false }) {
  const [verb, setVerb] = useState(() => randItem(verbs));
  const [typed, setTyped] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setVerb(randItem(verbs));
      setTyped(false);
    }, 2200);
    return () => clearInterval(id);
  }, [verbs]);

  const verbBase = verb.replace(/[.…]+$/, "");

  if (compact) {
    return (
      <p className="animated-verbs-compact">
        <Typewriter key={verb} text={verbBase} onDone={() => setTyped(true)} />
        {typed && <AnimatedDots />}
      </p>
    );
  }

  return (
    <div className="gen-verb-wrap" style={{ textAlign: "center" }}>
      <p className="gen-verb" style={{ color: "var(--amber)" }}>
        <Typewriter key={verb} text={verbBase} onDone={() => setTyped(true)} />
        {typed && <AnimatedDots />}
      </p>
      {subtitle && <p className="gen-phase-name">{subtitle}</p>}
    </div>
  );
}
