import { useEffect, useRef, useState } from "react";
import { PHASES, MIN_PHASE_MS } from "../constants.js";
import { randItem } from "../util.js";
import { getSettingsSync } from "../storage.js";

/**
 * Drives the generating overlay. Watches the streamed JSON for each phase's
 * marker string; when found, schedules completion no earlier than
 * MIN_PHASE_MS after the phase started. Holds the green "done" flash for
 * 900ms before advancing to the next phase.
 *
 * All timers are tracked explicitly so the effect cleanup can cancel them on
 * unmount or cancellation.
 */
export function useGeneratingProgress(active, accumulated) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [doneIds, setDoneIds] = useState([]);
  const [verb, setVerb] = useState("");
  const [justDone, setJustDone] = useState(false);

  const state = useRef(null);

  const makeState = () => ({
    idx: 0,
    startedAt: 0,
    pendingDone: new Set(),
    verbTimer: null,
    completeTimers: new Set(),
    advanceTimer: null,
  });

  useEffect(() => {
    if (!active) {
      if (state.current) cancelAllTimers(state.current);
      state.current = null;
      setPhaseIdx(0);
      setDoneIds([]);
      setVerb("");
      setJustDone(false);
      return;
    }

    const s = makeState();
    state.current = s;
    const userSettings = getSettingsSync();
    const verbMs   = Number(userSettings.verbCycleMs) || 1600;
    const minPhase = Number(userSettings.minPhaseMs)  || MIN_PHASE_MS;
    s.minPhase = minPhase;

    const startPhase = (idx) => {
      if (idx >= PHASES.length) return;
      const p = PHASES[idx];
      s.startedAt = Date.now();
      setPhaseIdx(idx);
      setVerb(randItem(p.verbs));
      clearInterval(s.verbTimer);
      s.verbTimer = setInterval(() => setVerb(randItem(p.verbs)), verbMs);
    };

    const completePhase = (id) => {
      setDoneIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setJustDone(true);
      s.advanceTimer = setTimeout(() => {
        s.advanceTimer = null;
        setJustDone(false);
        s.idx++;
        startPhase(s.idx);
      }, 900);
    };

    s.scheduleComplete = (id, minMs) => {
      if (s.pendingDone.has(id)) return;
      s.pendingDone.add(id);
      const elapsed = Date.now() - s.startedAt;
      const delay = Math.max(0, minMs - elapsed);
      const t = setTimeout(() => {
        s.completeTimers.delete(t);
        completePhase(id);
      }, delay);
      s.completeTimers.add(t);
    };

    startPhase(0);

    return () => cancelAllTimers(s);
  }, [active]);

  useEffect(() => {
    const s = state.current;
    if (!active || !s || !accumulated) return;
    PHASES.forEach((p, i) => {
      if (i > s.idx) return;
      if (s.pendingDone.has(p.id)) return;
      if (!p.streamMarker) {
        if (accumulated.trimEnd().endsWith("}")) s.scheduleComplete(p.id, s.minPhase ?? MIN_PHASE_MS);
        return;
      }
      if (accumulated.includes(p.streamMarker)) s.scheduleComplete(p.id, s.minPhase ?? MIN_PHASE_MS);
    });
  }, [accumulated, active]);

  return { phaseIdx, doneIds, verb, justDone };
}

function cancelAllTimers(s) {
  if (s.verbTimer) clearInterval(s.verbTimer);
  if (s.advanceTimer) clearTimeout(s.advanceTimer);
  s.completeTimers.forEach((t) => clearTimeout(t));
  s.completeTimers.clear();
}
