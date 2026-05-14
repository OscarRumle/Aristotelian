import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { RELATIONSHIP_TYPES, RELATIONSHIP_TYPES_BY_ID, ROLE_OPTIONS } from "../constants.js";
import { callClaude } from "../api/claude.js";
import { extractJson } from "../util.js";
import { buildRelationshipPrompt } from "../prompts/buildRelationshipPrompt.js";
import { buildCustomRelationshipPrompt } from "../prompts/buildCustomRelationshipPrompt.js";
import {
  buildRelationshipWritebackPrompt,
  RELATIONSHIP_WRITEBACK_FIELDS,
} from "../prompts/buildRelationshipWritebackPrompt.js";
import { RelationshipPanel } from "./RelationshipPanel.jsx";

const STAGE_W = 800;
const STAGE_H = 480;
const NODE_R_LEAD = 26;
const NODE_R_DEUT = 22;
const NODE_R_DEFAULT = 19;
const NODE_R_SUPPORT = 17;
const NODE_R_MINOR = 14;
const DRAG_THRESHOLD_PX = 4;
const MIN_GEN_MS = 700;
const MIN_VIEW_W = 200;            // zoom-in cap (smaller = more zoomed)
const MAX_VIEW_W = STAGE_W * 4;    // zoom-out cap
const FIT_PADDING = 60;
const ZOOM_FACTOR = 1.12;

const STANDARD_ROLES = new Set(ROLE_OPTIONS.map((r) => r.value));

function nodeRadius(role) {
  switch (role) {
    case "Lead":          return NODE_R_LEAD;
    case "Deuteragonist": return NODE_R_DEUT;
    case "Supporting":    return NODE_R_SUPPORT;
    case "Minor":         return NODE_R_MINOR;
    default:              return NODE_R_DEFAULT;
  }
}

function initials(name) {
  if (!name) return "??";
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

function computeInitialPositions(characters) {
  const cx = STAGE_W / 2, cy = STAGE_H / 2;
  const n = characters.length;
  if (n === 0) return {};
  if (n === 1) return { [characters[0].id]: { x: cx, y: cy } };

  const lead = characters.find((c) => c.role === "Lead");
  const ring = lead ? characters.filter((c) => c.id !== lead.id) : characters;
  const radius = Math.min(STAGE_W, STAGE_H) * 0.35;
  const out = {};
  if (lead) out[lead.id] = { x: cx, y: cy };
  ring.forEach((c, i) => {
    const angle = (i / ring.length) * 2 * Math.PI - Math.PI / 2;
    out[c.id] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
  return out;
}

function edgeKey(aId, bId) {
  return [aId, bId].sort().join("|");
}

function genId() {
  return "rel_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Stable hash of an edge id → a number in [0, 1). Used to give each edge a
// slightly different particle drift speed so they don't all sync up.
function edgeHash01(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h >>> 0) % 1000) / 1000;
}

const WRITEBACK_FIELD_SET = new Set(RELATIONSHIP_WRITEBACK_FIELDS);

// Strip the LLM patch object down to allowed keys with non-empty string values.
// Returns null if nothing usable remains.
function sanitizeFieldPatch(patch) {
  if (!patch || typeof patch !== "object") return null;
  const out = {};
  let any = false;
  for (const [k, v] of Object.entries(patch)) {
    if (!WRITEBACK_FIELD_SET.has(k)) continue;
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (!trimmed) continue;
    out[k] = trimmed;
    any = true;
  }
  return any ? out : null;
}

// ── Reducer ────────────────────────────────────────────────────────────────

const INIT_STATE = {
  phase: "idle",         // idle | first | type | gen | review | confirmed | edge-detail | confirm-delete
  selected: [],          // 0, 1, or 2 character ids (ordered)
  pickedType: null,
  pickedDirection: null,
  customText: "",        // user text when type === 'custom'
  result: null,
  newEdgeId: null,
  editingEdgeId: null,   // id of edge being edited (review-from-edge path)
  selectedEdgeId: null,  // id of edge being inspected (edge-detail / confirm-delete)
  error: null,
  writebackStatus: null, // null | 'pending' | 'ok' | 'failed'
};

function reducer(state, action) {
  switch (action.type) {
    case "RESET":
      return { ...INIT_STATE };
    case "TOGGLE_NODE": {
      const id = action.id;
      // From a modal-ish detail phase, clicking a node resets and starts fresh
      if (state.phase === "edge-detail" || state.phase === "confirm-delete") {
        return { ...INIT_STATE, selected: [id], phase: "first" };
      }
      // Already selected: deselect
      if (state.selected.includes(id)) {
        const next = state.selected.filter((x) => x !== id);
        return { ...INIT_STATE, selected: next, phase: next.length ? "first" : "idle" };
      }
      // First selection
      if (state.selected.length === 0) {
        return { ...INIT_STATE, selected: [id], phase: "first" };
      }
      // Second selection (pair)
      if (state.selected.length === 1) {
        return { ...INIT_STATE, selected: [state.selected[0], id], phase: "type" };
      }
      return state;
    }
    case "PICK_TYPE": {
      const type = RELATIONSHIP_TYPES_BY_ID[action.id];
      return {
        ...state,
        pickedType: action.id,
        pickedDirection: type?.directional ? (state.pickedDirection || "a_to_b") : null,
        customText: action.id === "custom" ? state.customText : "",
        error: null,
      };
    }
    case "PICK_DIRECTION":
      return { ...state, pickedDirection: action.direction };
    case "SET_CUSTOM_TEXT":
      return { ...state, customText: action.text };
    case "GEN_START":
      return { ...state, phase: "gen", error: null };
    case "GEN_SUCCESS":
      return { ...state, phase: "review", result: action.result, error: null };
    case "GEN_ERROR":
      return { ...state, phase: "type", error: action.message };
    case "TRY_AGAIN":
      return { ...state, phase: "type", pickedType: null, pickedDirection: null, customText: "", result: null };
    case "OPEN_EDGE_DETAIL":
      // Reset everything except the new-edge marker so existing draw-in
      // animations don't get clobbered.
      return { ...INIT_STATE, phase: "edge-detail", selectedEdgeId: action.edgeId, newEdgeId: state.newEdgeId };
    case "START_EDIT":
      return {
        ...INIT_STATE,
        phase: "review",
        editingEdgeId: state.selectedEdgeId,
        selected: action.selected,
        pickedType: action.result.type,
        pickedDirection: action.result.direction,
        result: action.result,
        newEdgeId: state.newEdgeId,
      };
    case "ASK_DELETE":
      return { ...state, phase: "confirm-delete" };
    case "CANCEL_DELETE":
      return { ...state, phase: "edge-detail" };
    case "DELETED":
      return { ...INIT_STATE };
    case "CONFIRMED":
      return { ...state, phase: "confirmed", newEdgeId: action.edgeId, writebackStatus: "pending", selected: [], pickedType: null, pickedDirection: null, customText: "", result: null, editingEdgeId: null };
    case "WRITEBACK_DONE":
      // Only update the panel's writebackStatus if we're still on the confirmed
      // screen for this same edge. World-state status is updated separately.
      if (state.phase !== "confirmed" || state.newEdgeId !== action.edgeId) return state;
      return { ...state, writebackStatus: action.ok ? "ok" : "failed" };
    case "WRITEBACK_RETRY":
      return { ...state, writebackStatus: "pending" };
    case "CONNECT_ANOTHER": {
      const keepA = action.keepA;
      return { ...INIT_STATE, selected: keepA ? [keepA] : [], phase: keepA ? "first" : "idle", newEdgeId: state.newEdgeId };
    }
    case "CLEAR_NEW_EDGE":
      return { ...state, newEdgeId: null };
    default:
      return state;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export function RelationshipWeb({ world, onBack, onUpdateWorld, onUpdateCharacter, onNewCharacter }) {
  const characters = world.characters ?? [];
  const relationships = world.relationships ?? [];

  const [state, dispatch] = useReducer(reducer, INIT_STATE);
  const [draggingId, setDraggingId] = useState(null);
  const [dragPos, setDragPos] = useState(null);
  const [hoverEdge, setHoverEdge] = useState(null); // { edgeId, text, x, y }
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: STAGE_W, h: STAGE_H });
  const [focusedId, setFocusedId] = useState(null); // ephemeral focus mode

  const filters = world.relationship_filters ?? { hiddenTypes: [], showUnconnected: false };
  const hiddenTypeSet = useMemo(() => new Set(filters.hiddenTypes ?? []), [filters.hiddenTypes]);
  const hasActiveFilters = (filters.hiddenTypes?.length ?? 0) > 0 || !!filters.showUnconnected;

  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const panRef = useRef(null);
  const rafRef = useRef(null);
  const viewBoxRef = useRef(viewBox);
  useEffect(() => { viewBoxRef.current = viewBox; }, [viewBox]);
  const phaseRef = useRef(state.phase);
  useEffect(() => { phaseRef.current = state.phase; }, [state.phase]);
  const worldRef = useRef(world);
  useEffect(() => { worldRef.current = world; }, [world]);
  const onUpdateWorldRef = useRef(onUpdateWorld);
  useEffect(() => { onUpdateWorldRef.current = onUpdateWorld; }, [onUpdateWorld]);

  // Compute positions: prefer character.x/y, fall back to ring layout.
  const positions = useMemo(() => {
    const initial = computeInitialPositions(characters);
    const out = {};
    for (const c of characters) {
      if (typeof c.x === "number" && typeof c.y === "number") {
        out[c.id] = { x: c.x, y: c.y };
      } else if (initial[c.id]) {
        out[c.id] = initial[c.id];
      }
    }
    return out;
  }, [characters]);

  const charById = useMemo(() => Object.fromEntries(characters.map((c) => [c.id, c])), [characters]);

  // Filter out orphaned edges where a character was deleted
  const visibleEdges = useMemo(
    () => relationships.filter((e) => charById[e.a] && charById[e.b]),
    [relationships, charById]
  );

  // Apply type-visibility filters (visual only — orphans already excluded above)
  const filteredEdges = useMemo(
    () => visibleEdges.filter((e) => !hiddenTypeSet.has(e.type)),
    [visibleEdges, hiddenTypeSet]
  );

  // Characters with at least one connection that's currently visible
  const connectedIds = useMemo(() => {
    const s = new Set();
    for (const e of filteredEdges) { s.add(e.a); s.add(e.b); }
    return s;
  }, [filteredEdges]);

  // Focus-mode neighborhood: focused node + its connected neighbours
  const focusedNeighborhood = useMemo(() => {
    if (!focusedId) return null;
    const out = new Set([focusedId]);
    for (const e of filteredEdges) {
      if (e.a === focusedId) out.add(e.b);
      if (e.b === focusedId) out.add(e.a);
    }
    return out;
  }, [focusedId, filteredEdges]);

  const edgeBetween = (aId, bId) =>
    visibleEdges.find((e) => (e.a === aId && e.b === bId) || (e.a === bId && e.b === aId));

  // ── Filter / focus setters ──────────────────────────────────────────────

  const setFilters = (next) => {
    const latest = worldRef.current;
    if (!latest) return;
    onUpdateWorldRef.current?.({ ...latest, relationship_filters: next });
  };
  const toggleTypeFilter = (typeId) => {
    const hidden = new Set(filters.hiddenTypes ?? []);
    if (hidden.has(typeId)) hidden.delete(typeId);
    else hidden.add(typeId);
    setFilters({ ...filters, hiddenTypes: [...hidden] });
  };
  const toggleShowUnconnected = () => {
    setFilters({ ...filters, showUnconnected: !filters.showUnconnected });
  };
  const clearFilters = () => setFilters({ hiddenTypes: [], showUnconnected: false });
  const toggleFocus = (id) => setFocusedId((cur) => (cur === id ? null : id));

  // Clear the "new edge" draw-in animation flag after the animation duration
  useEffect(() => {
    if (!state.newEdgeId) return;
    const t = setTimeout(() => dispatch({ type: "CLEAR_NEW_EDGE" }), 1100);
    return () => clearTimeout(t);
  }, [state.newEdgeId]);

  // Prune orphaned relationships (both endpoints must still exist) whenever the
  // character roster changes. Render-time filtering already protects the UI;
  // this clears the data so storage doesn't accumulate dead entries when a
  // character is removed elsewhere in the app.
  useEffect(() => {
    const rels = worldRef.current?.relationships ?? [];
    const valid = rels.filter((r) => charById[r.a] && charById[r.b]);
    if (valid.length === rels.length) return;
    onUpdateWorldRef.current?.({ ...worldRef.current, relationships: valid });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters.length]);

  // Auto-return to idle after confirmed state.
  // - While writeback is pending, keep the panel sticky long enough that most
  //   calls land in-view (typical writeback is 15–25s on Sonnet).
  // - Once writeback resolves (ok), give the user a few seconds to read the
  //   success message before resetting.
  // - On failure, hold longer so the Retry button is reachable. The edge also
  //   carries a persistent warning glyph on the stage.
  useEffect(() => {
    if (state.phase !== "confirmed") return;
    if (state.writebackStatus === "pending") {
      const t = setTimeout(() => dispatch({ type: "RESET" }), 35000);
      return () => clearTimeout(t);
    }
    if (state.writebackStatus === "failed") {
      const t = setTimeout(() => dispatch({ type: "RESET" }), 10000);
      return () => clearTimeout(t);
    }
    // ok (or null) — let the user read the message, then reset
    const t = setTimeout(() => dispatch({ type: "RESET" }), 3200);
    return () => clearTimeout(t);
  }, [state.phase, state.writebackStatus]);

  // Live position for the currently dragging node
  const livePosition = (id) => {
    if (draggingId === id && dragPos) return dragPos;
    return positions[id];
  };

  // ── Pointer handlers ────────────────────────────────────────────────────

  const screenToSvg = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  };

  const onNodePointerDown = (e, charId) => {
    if (state.phase === "gen" || state.phase === "review" || state.phase === "confirmed") return;
    e.stopPropagation();
    const { x: sx, y: sy } = screenToSvg(e.clientX, e.clientY);
    const pos = positions[charId];
    dragRef.current = {
      charId,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      offsetX: pos.x - sx,
      offsetY: pos.y - sy,
      dragging: false,
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  const onNodePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    const dx = clientX - drag.startClientX;
    const dy = clientY - drag.startClientY;
    if (!drag.dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    if (!drag.dragging) {
      drag.dragging = true;
      setDraggingId(drag.charId);
    }
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const { x: sx, y: sy } = screenToSvg(clientX, clientY);
      const r = nodeRadius(charById[drag.charId]?.role);
      const x = Math.max(r, Math.min(STAGE_W - r, sx + drag.offsetX));
      const y = Math.max(r, Math.min(STAGE_H - r, sy + drag.offsetY));
      setDragPos({ x, y });
    });
  };

  const onNodePointerUp = (e, charId) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const wasDragging = drag.dragging;
    const finalPos = dragPos;
    dragRef.current = null;
    setDraggingId(null);
    setDragPos(null);

    if (wasDragging && finalPos && onUpdateCharacter) {
      const char = charById[charId];
      if (char) onUpdateCharacter({ ...char, x: finalPos.x, y: finalPos.y });
    } else {
      handleNodeClick(charId);
    }
  };

  // ── Pan / zoom / fit-to-screen ────────────────────────────────────────

  const computeFitViewBox = () => {
    const ps = characters
      .map((c) => livePosition(c.id))
      .filter(Boolean);
    if (ps.length === 0) return { x: 0, y: 0, w: STAGE_W, h: STAGE_H };
    const xs = ps.map((p) => p.x);
    const ys = ps.map((p) => p.y);
    const minX = Math.min(...xs) - FIT_PADDING;
    const maxX = Math.max(...xs) + FIT_PADDING;
    const minY = Math.min(...ys) - FIT_PADDING;
    const maxY = Math.max(...ys) + FIT_PADDING;
    const stageAspect = STAGE_W / STAGE_H;
    let w = Math.max(MIN_VIEW_W, maxX - minX);
    let h = Math.max(MIN_VIEW_W / stageAspect, maxY - minY);
    if (w / h > stageAspect) h = w / stageAspect;
    else w = h * stageAspect;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  };

  const handleFitScreen = () => setViewBox(computeFitViewBox());

  // Fit on mount: per spec, zoom/pan resets on each visit.
  // We use a ref to only run this once with the initial positions.
  const fitDoneRef = useRef(false);
  useEffect(() => {
    if (fitDoneRef.current) return;
    if (characters.length === 0) return;
    fitDoneRef.current = true;
    setViewBox(computeFitViewBox());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters.length]);

  // Non-passive wheel listener so preventDefault actually stops page scroll
  // while zooming. React's onWheel is passive by default, so this must be a
  // direct addEventListener with passive: false.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handler = (e) => {
      if (phaseRef.current === "gen") return;
      e.preventDefault();
      const { x: sx, y: sy } = screenToSvg(e.clientX, e.clientY);
      const vb = viewBoxRef.current;
      const factor = e.deltaY > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      const newW = Math.max(MIN_VIEW_W, Math.min(MAX_VIEW_W, vb.w * factor));
      const ratio = newW / vb.w;
      const newH = vb.h * ratio;
      const newX = sx - (sx - vb.x) * ratio;
      const newY = sy - (sy - vb.y) * ratio;
      setViewBox({ x: newX, y: newY, w: newW, h: newH });
    };
    svg.addEventListener("wheel", handler, { passive: false });
    return () => svg.removeEventListener("wheel", handler);
  }, []);

  const onBackgroundPointerDown = (e) => {
    if (state.phase === "gen" || state.phase === "review" || state.phase === "confirmed") return;
    // Start a potential pan. If pointer moves past threshold, it becomes a pan;
    // otherwise on pointerup we treat it as a click (deselect / dismiss panel).
    panRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startViewBox: { ...viewBoxRef.current },
      panning: false,
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  const onStagePointerMove = (e) => {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== e.pointerId) return;
    const dx = e.clientX - pan.startClientX;
    const dy = e.clientY - pan.startClientY;
    if (!pan.panning && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    pan.panning = true;
    // Translate the viewBox by the pointer movement (converted from screen units to svg units)
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const vb = pan.startViewBox;
    const svgDx = (dx / rect.width) * vb.w;
    const svgDy = (dy / rect.height) * vb.h;
    setViewBox({ x: vb.x - svgDx, y: vb.y - svgDy, w: vb.w, h: vb.h });
  };

  const onStagePointerUp = (e) => {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== e.pointerId) return; // not our pointer (e.g. node release bubbled up)
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    const wasPanning = pan.panning;
    panRef.current = null;
    if (!wasPanning) handleBackgroundClick();
  };

  const handleBackgroundClick = () => {
    if (state.phase === "gen" || state.phase === "review" || state.phase === "confirmed") return;
    if (focusedId) { setFocusedId(null); return; }
    if (state.phase === "edge-detail" || state.phase === "confirm-delete") {
      dispatch({ type: "RESET" });
      return;
    }
    if (state.selected.length > 0) dispatch({ type: "RESET" });
  };

  // ── Click logic (selection + edge interaction) ─────────────────────────

  const handleNodeClick = (charId) => {
    if (state.phase === "gen" || state.phase === "review" || state.phase === "confirmed") return;
    // If we have one selected and click an existing edge endpoint, open the
    // edge detail for that connection instead of stacking a second selection.
    if (state.selected.length === 1 && state.selected[0] !== charId) {
      const existing = edgeBetween(state.selected[0], charId);
      if (existing) {
        dispatch({ type: "OPEN_EDGE_DETAIL", edgeId: existing.id });
        return;
      }
    }
    dispatch({ type: "TOGGLE_NODE", id: charId });
  };

  const handleEdgeClick = (edge) => {
    if (state.phase === "gen" || state.phase === "review" || state.phase === "confirmed") return;
    dispatch({ type: "OPEN_EDGE_DETAIL", edgeId: edge.id });
  };

  const handleStartEdit = () => {
    if (!state.selectedEdgeId) return;
    const edge = (worldRef.current?.relationships ?? []).find((r) => r.id === state.selectedEdgeId);
    if (!edge) return;
    dispatch({
      type: "START_EDIT",
      selected: [edge.a, edge.b],
      result: {
        type: edge.type,
        direction: edge.direction,
        title: edge.title || "",
        description: edge.description || "",
        note: edge.note || "",
      },
    });
  };

  const handleAskDelete = () => dispatch({ type: "ASK_DELETE" });
  const handleCancelDelete = () => dispatch({ type: "CANCEL_DELETE" });

  const handleConfirmDelete = () => {
    if (!state.selectedEdgeId) return;
    const latest = worldRef.current;
    if (!latest) return;
    const nextRels = (latest.relationships ?? []).filter((r) => r.id !== state.selectedEdgeId);
    onUpdateWorldRef.current?.({ ...latest, relationships: nextRels });
    dispatch({ type: "DELETED" });
  };

  // ── Generation ──────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    const [aId, bId] = state.selected;
    const charA = charById[aId];
    const charB = charById[bId];
    const type = RELATIONSHIP_TYPES_BY_ID[state.pickedType];
    if (!charA || !charB || !type) return;

    dispatch({ type: "GEN_START" });
    const start = Date.now();
    try {
      const direction = type.directional ? (state.pickedDirection || "a_to_b") : "bidirectional";
      const system = buildRelationshipPrompt(world, charA, charB, type, direction);
      const raw = await callClaude(system, "Generate the dramatic connection.", { maxTokens: 800 });
      const jsonStr = extractJson(raw);
      if (!jsonStr) throw new Error("No JSON in response");
      const parsed = JSON.parse(jsonStr);
      const elapsed = Date.now() - start;
      if (elapsed < MIN_GEN_MS) await new Promise((r) => setTimeout(r, MIN_GEN_MS - elapsed));
      if (phaseRef.current !== "gen") return; // user navigated away
      dispatch({
        type: "GEN_SUCCESS",
        result: {
          type: parsed.type || type.id,
          direction: parsed.direction || direction,
          title: parsed.title || "An Untold Connection",
          description: parsed.description || "",
          note: parsed.note || "",
        },
      });
    } catch (err) {
      console.error("Relationship gen failed", err);
      dispatch({ type: "GEN_ERROR", message: "Generation failed. Try again." });
    }
  };

  const handleCustomStay = () => {
    const text = state.customText.trim();
    if (!text) return;
    // Try to lift a title from the first short phrase; otherwise leave empty.
    const firstSentence = text.split(/[.!?\n]/)[0].trim();
    const title = firstSentence && firstSentence.length <= 60 && firstSentence !== text ? firstSentence : "";
    dispatch({
      type: "GEN_SUCCESS",
      result: {
        type: "custom",
        direction: "bidirectional",
        title,
        description: text,
        note: "",
      },
    });
  };

  const handleCustomLLM = async (mode) => {
    const [aId, bId] = state.selected;
    const charA = charById[aId];
    const charB = charById[bId];
    const text = state.customText.trim();
    if (!charA || !charB || !text) return;

    dispatch({ type: "GEN_START" });
    const start = Date.now();
    try {
      const system = buildCustomRelationshipPrompt(world, charA, charB, text, mode);
      const raw = await callClaude(system, mode === "refine" ? "Refine the connection." : "Expand the connection.", { maxTokens: 900 });
      const jsonStr = extractJson(raw);
      if (!jsonStr) throw new Error("No JSON in response");
      const parsed = JSON.parse(jsonStr);
      const elapsed = Date.now() - start;
      if (elapsed < MIN_GEN_MS) await new Promise((r) => setTimeout(r, MIN_GEN_MS - elapsed));
      if (phaseRef.current !== "gen") return;
      dispatch({
        type: "GEN_SUCCESS",
        result: {
          type: "custom",
          direction: "bidirectional",
          title: parsed.title || "",
          description: parsed.description || text,
          note: parsed.note || "",
        },
      });
    } catch (err) {
      console.error("Custom relationship gen failed", err);
      dispatch({ type: "GEN_ERROR", message: "Generation failed. Try again." });
    }
  };

  const handleConfirm = () => {
    if (!state.result) return;
    const [aId, bId] = state.selected;
    const charA = charById[aId];
    const charB = charById[bId];
    if (!charA || !charB) return;

    if (state.editingEdgeId) {
      // Edit path: replace the existing edge in place and re-run writeback.
      const existing = (worldRef.current?.relationships ?? []).find((r) => r.id === state.editingEdgeId);
      if (!existing) return;
      const edge = {
        ...existing,
        type: state.result.type,
        direction: state.result.direction,
        title: state.result.title,
        description: state.result.description,
        note: state.result.note,
        writeback_status: "pending",
        updatedAt: Date.now(),
      };
      const latest = worldRef.current;
      const nextRels = (latest.relationships ?? []).map((r) => (r.id === edge.id ? edge : r));
      onUpdateWorldRef.current?.({ ...latest, relationships: nextRels });
      dispatch({ type: "CONFIRMED", edgeId: edge.id });
      runWriteback(edge, charA, charB);
      return;
    }

    // Create path
    const edge = {
      id: genId(),
      a: aId,
      b: bId,
      type: state.result.type,
      direction: state.result.direction,
      title: state.result.title,
      description: state.result.description,
      note: state.result.note,
      writeback_status: "pending",
      createdAt: Date.now(),
    };
    const next = { ...world, relationships: [...relationships, edge] };
    onUpdateWorld(next);
    dispatch({ type: "CONFIRMED", edgeId: edge.id });
    runWriteback(edge, charA, charB);
  };

  // Async, fire-and-forget. Composes against worldRef.current so it always
  // merges with the latest world state (in case the user has touched anything
  // else in the meantime).
  const runWriteback = async (edge, charA, charB) => {
    try {
      const system = buildRelationshipWritebackPrompt(world, charA, charB, edge);
      const raw = await callClaude(system, "Weave the connection into the character sheets.", { maxTokens: 4000 });
      const jsonStr = extractJson(raw);
      if (!jsonStr) throw new Error("No JSON in writeback response");
      const parsed = JSON.parse(jsonStr);
      applyWritebackResult(edge.id, edge.a, edge.b, parsed);
      dispatch({ type: "WRITEBACK_DONE", ok: true, edgeId: edge.id });
    } catch (err) {
      console.error("Relationship writeback failed", err);
      markWritebackStatus(edge.id, "failed");
      dispatch({ type: "WRITEBACK_DONE", ok: false, edgeId: edge.id });
    }
  };

  const applyWritebackResult = (edgeId, aId, bId, parsed) => {
    const latest = worldRef.current;
    if (!latest) return;
    const aPatch = sanitizeFieldPatch(parsed?.a);
    const bPatch = sanitizeFieldPatch(parsed?.b);
    const nextChars = (latest.characters ?? []).map((c) => {
      if (c.id === aId && aPatch) return { ...c, ...aPatch };
      if (c.id === bId && bPatch) return { ...c, ...bPatch };
      return c;
    });
    const nextRels = (latest.relationships ?? []).map((r) =>
      r.id === edgeId ? { ...r, writeback_status: "ok" } : r
    );
    onUpdateWorldRef.current?.({ ...latest, characters: nextChars, relationships: nextRels });
  };

  const markWritebackStatus = (edgeId, status) => {
    const latest = worldRef.current;
    if (!latest) return;
    const nextRels = (latest.relationships ?? []).map((r) =>
      r.id === edgeId ? { ...r, writeback_status: status } : r
    );
    onUpdateWorldRef.current?.({ ...latest, relationships: nextRels });
  };

  const handleRetryWriteback = () => {
    if (!state.newEdgeId) return;
    const edge = (worldRef.current?.relationships ?? []).find((r) => r.id === state.newEdgeId);
    if (!edge) return;
    const charA = charById[edge.a];
    const charB = charById[edge.b];
    if (!charA || !charB) return;
    markWritebackStatus(edge.id, "pending");
    dispatch({ type: "WRITEBACK_RETRY" });
    runWriteback(edge, charA, charB);
  };

  const handleConnectAnother = () => {
    const a = state.selected[0];
    // After CONFIRMED we cleared selected; the keepA we want is the original A.
    // The reducer keeps newEdgeId; we look up the new edge to extract its A.
    const newEdge = relationships[relationships.length - 1] || visibleEdges[visibleEdges.length - 1];
    const keepA = a || newEdge?.a;
    dispatch({ type: "CONNECT_ANOTHER", keepA });
  };

  // ── Selectors for the panel ─────────────────────────────────────────────

  const charA = state.selected[0] ? charById[state.selected[0]] : null;
  const charB = state.selected[1] ? charById[state.selected[1]] : null;

  // ── Render ──────────────────────────────────────────────────────────────

  const connectionCount = visibleEdges.length;

  return (
    <div className="screen wd-page rw-screen" style={{ paddingBottom: 0 }}>
      <div className="tool-view-header">
        <button type="button" className="back-btn" onClick={onBack}>
          ← {world.name}
        </button>
        <h2 className="tool-view-title">Relationship Web</h2>
      </div>

      <div className="rw-subhead">
        <div className="rw-legend" aria-label="Connection type filters">
          {RELATIONSHIP_TYPES.filter((t) => t.id !== "custom").map((t) => {
            const off = hiddenTypeSet.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                className={`rw-legend-chip${off ? " is-off" : ""}`}
                onClick={() => toggleTypeFilter(t.id)}
                title={off ? `Show ${t.label} connections` : `Hide ${t.label} connections`}
              >
                <span className="rw-legend-dot" style={{ background: `var(${t.colorVar})` }} />
                <span>{t.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            className={`rw-legend-chip rw-unconn-chip${filters.showUnconnected ? " is-on" : ""}`}
            onClick={toggleShowUnconnected}
            title="Highlight characters with no connections"
          >
            <span className="rw-unconn-dot" />
            <span>Unconnected</span>
          </button>
          {hasActiveFilters && (
            <button type="button" className="rw-clear-filters" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
        <div className="rw-subhead-right">
          {connectionCount > 0 && (
            <div className="rw-count">{connectionCount} {connectionCount === 1 ? "connection" : "connections"}</div>
          )}
          <button type="button" className="rw-fit-btn" onClick={handleFitScreen} aria-label="Fit to screen" title="Fit to screen">
            ⤢ Fit
          </button>
        </div>
      </div>

      {characters.length === 0 ? (
        <div className="rw-empty">
          <p className="rw-empty-quote">"Every character carries a flaw. The web maps how those flaws pull against each other."</p>
          <p className="rw-empty-body">
            No characters in this world yet — the web is ready, it just needs people in it.
          </p>
          {onNewCharacter && (
            <button type="button" className="btn btn-primary rw-empty-cta" onClick={onNewCharacter}>
              + Create your first character
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="rw-stage">
            <svg
              ref={svgRef}
              className="rw-stage-svg"
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
              preserveAspectRatio="xMidYMid meet"
              onPointerDown={onBackgroundPointerDown}
              onPointerMove={onStagePointerMove}
              onPointerUp={onStagePointerUp}
              onPointerCancel={onStagePointerUp}
            >
              <defs>
                {RELATIONSHIP_TYPES.filter((t) => t.directional).map((t) => (
                  <marker
                    key={t.id}
                    id={`rw-arrow-${t.id}`}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M0,0 L10,5 L0,10 Z" fill={`var(${t.colorVar})`} />
                  </marker>
                ))}
              </defs>

              {/* Edges */}
              {filteredEdges.map((e) => {
                const type = RELATIONSHIP_TYPES_BY_ID[e.type];
                if (!type) return null;
                const aPos = livePosition(e.a);
                const bPos = livePosition(e.b);
                if (!aPos || !bPos) return null;
                const isNew = e.id === state.newEdgeId;
                const isSelectedEdge = e.id === state.selectedEdgeId;
                const isFocusDimmed = focusedNeighborhood
                  && !(focusedNeighborhood.has(e.a) && focusedNeighborhood.has(e.b));
                const len = Math.hypot(bPos.x - aPos.x, bPos.y - aPos.y);
                // For directional edges, the arrow points from a → b (or b → a)
                let x1 = aPos.x, y1 = aPos.y, x2 = bPos.x, y2 = bPos.y;
                if (type.directional && e.direction === "b_to_a") {
                  x1 = bPos.x; y1 = bPos.y; x2 = aPos.x; y2 = aPos.y;
                }
                const markerEnd = type.directional ? `url(#rw-arrow-${type.id})` : undefined;
                const failed = e.writeback_status === "failed";
                const mx = (x1 + x2) / 2;
                const my = (y1 + y2) / 2;
                return (
                  <g
                    key={e.id}
                    className={`rw-edge${isSelectedEdge ? " is-selected" : ""}${isFocusDimmed ? " is-dimmed" : ""}`}
                    data-edge-id={e.id}
                    onClick={() => handleEdgeClick(e)}
                    onMouseEnter={() => setHoverEdge({ edgeId: e.id, text: e.title || RELATIONSHIP_TYPES_BY_ID[e.type]?.label || "Connection", x: mx, y: my })}
                    onMouseLeave={() => setHoverEdge((h) => (h?.edgeId === e.id ? null : h))}
                  >
                    <line className="rw-edge-hit" x1={x1} y1={y1} x2={x2} y2={y2} />
                    <line
                      className={`rw-edge-visible${isNew ? " rw-edge-draw-in" : ""}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={`var(${type.colorVar})`}
                      markerEnd={markerEnd}
                      style={isNew ? { "--rw-edge-len": len, strokeDasharray: len, strokeDashoffset: len } : undefined}
                    />
                    {failed && (
                      <g className="rw-edge-warn" transform={`translate(${mx},${my})`}>
                        <circle r="7" />
                        <text dy="0.35em">!</text>
                        <title>Writeback to character sheets failed</title>
                      </g>
                    )}
                    {/* Ambient particles drifting along the edge */}
                    {!isNew && (() => {
                      const h = edgeHash01(e.id);
                      const dur1 = (3 + h * 2).toFixed(2);     // 3.0 – 5.0s
                      const dur2 = (3.5 + h * 1.5).toFixed(2); // 3.5 – 5.0s, offset
                      return (
                        <>
                          <circle className="rw-edge-particle" r="2.4" fill={`var(${type.colorVar})`} opacity=".75">
                            <animateMotion dur={`${dur1}s`} repeatCount="indefinite" path={`M${x1},${y1} L${x2},${y2}`} />
                          </circle>
                          <circle className="rw-edge-particle" r="1.8" fill={`var(${type.colorVar})`} opacity=".35">
                            <animateMotion dur={`${dur2}s`} repeatCount="indefinite" path={`M${x2},${y2} L${x1},${y1}`} />
                          </circle>
                        </>
                      );
                    })()}
                  </g>
                );
              })}

              {/* Pending line between selected pair */}
              {state.selected.length === 2 && (() => {
                const a = livePosition(state.selected[0]);
                const b = livePosition(state.selected[1]);
                if (!a || !b) return null;
                const isGen = state.phase === "gen";
                return (
                  <line
                    className={`rw-pending-line${isGen ? " rw-pending-line-gen" : ""}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                  />
                );
              })()}

              {/* Nodes */}
              {characters.map((c) => {
                const pos = livePosition(c.id);
                if (!pos) return null;
                const r = nodeRadius(c.role);
                const isSelected = state.selected.includes(c.id);
                const isFocusDimmed = focusedNeighborhood && !focusedNeighborhood.has(c.id);
                const isFocused = focusedId === c.id;
                const isUnconnected = filters.showUnconnected && !connectedIds.has(c.id);
                return (
                  <g
                    key={c.id}
                    className={[
                      "rw-node",
                      isSelected ? "is-selected" : "",
                      draggingId === c.id ? "is-dragging" : "",
                      isFocused ? "is-focused" : "",
                      isFocusDimmed ? "is-dimmed" : "",
                      isUnconnected ? "is-unconnected" : "",
                    ].filter(Boolean).join(" ")}
                    transform={`translate(${pos.x},${pos.y})`}
                    onPointerDown={(e) => onNodePointerDown(e, c.id)}
                    onPointerMove={onNodePointerMove}
                    onPointerUp={(e) => onNodePointerUp(e, c.id)}
                    onPointerCancel={(e) => onNodePointerUp(e, c.id)}
                    onDoubleClick={(e) => { e.stopPropagation(); toggleFocus(c.id); }}
                  >
                    <circle className="rw-node-ring" r={r + 11} />
                    <circle className="rw-node-body" r={r} />
                    <text className="rw-node-init" dy="0.35em">{initials(c.name)}</text>
                    <text className="rw-node-label" y={r + 14}>{c.name || "Unnamed"}</text>
                    {STANDARD_ROLES.has(c.role) && <text className="rw-node-role" y={r + 26}>{c.role}</text>}
                    <circle className="rw-node-hit" r={r + 14} />
                  </g>
                );
              })}
            </svg>

            {hoverEdge && (
              <div
                className="rw-tooltip"
                style={{
                  left: `${(hoverEdge.x / STAGE_W) * 100}%`,
                  top: `${((hoverEdge.y - 18) / STAGE_H) * 100}%`,
                }}
              >
                {hoverEdge.text}
              </div>
            )}
          </div>

          <RelationshipPanel
            state={state}
            world={world}
            charA={charA}
            charB={charB}
            onClear={() => dispatch({ type: "RESET" })}
            onPickType={(id) => dispatch({ type: "PICK_TYPE", id })}
            onPickDirection={(direction) => dispatch({ type: "PICK_DIRECTION", direction })}
            onGenerate={handleGenerate}
            onTryAgain={() => dispatch({ type: "TRY_AGAIN" })}
            onConfirm={handleConfirm}
            onConnectAnother={handleConnectAnother}
            onCancel={() => dispatch({ type: "RESET" })}
            onRetryWriteback={handleRetryWriteback}
            onEditEdge={handleStartEdit}
            onAskDelete={handleAskDelete}
            onCancelDelete={handleCancelDelete}
            onConfirmDelete={handleConfirmDelete}
            onSetCustomText={(text) => dispatch({ type: "SET_CUSTOM_TEXT", text })}
            onCustomStay={handleCustomStay}
            onCustomRefine={() => handleCustomLLM("refine")}
            onCustomExpand={() => handleCustomLLM("expand")}
          />
        </>
      )}
    </div>
  );
}
