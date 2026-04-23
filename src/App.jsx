import { useState, useEffect, useRef } from "react";
import { loadWorlds, saveWorlds, resetStorage } from "./storage.js";
import { callClaude } from "./api/claude.js";
import { buildExpandPrompt } from "./prompts/expand.js";
import { extractJson } from "./util.js";
import { useGeneratingProgress } from "./hooks/useGeneratingProgress.js";
import { GeneratingOverlay } from "./components/GeneratingOverlay.jsx";
import { ErrorToast } from "./components/ErrorToast.jsx";
import { WorldHub } from "./components/WorldHub.jsx";
import { CreateWorldScreen } from "./components/CreateWorldScreen.jsx";
import { CreateWorldAdvanced } from "./components/CreateWorldAdvanced.jsx";
import { WorldDetail } from "./components/WorldDetail.jsx";
import { CreateCharacterScreen } from "./components/CreateCharacterScreen.jsx";
import { CharacterSheet } from "./components/CharacterSheet.jsx";
import { TokenCounter } from "./components/TokenCounter.jsx";

export default function App() {
  const [view, setView] = useState("hub");
  const [activeWorldId, setActiveWorldId] = useState(null);
  const [activeCharId, setActiveCharId] = useState(null);
  const [worlds, setWorlds] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [storageCorrupted, setStorageCorrupted] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [genError, setGenError] = useState(null);
  const [genAccumulated, setGenAccumulated] = useState("");

  const abortRef = useRef(null);

  const { phaseIdx, doneIds, verb, justDone } = useGeneratingProgress(generating, genAccumulated);

  const activeWorld = worlds.find((w) => w.id === activeWorldId);
  const activeChar = activeWorld?.characters.find((c) => c.id === activeCharId);

  useEffect(() => {
    const { worlds: loaded_worlds, corrupted } = loadWorlds();
    setWorlds(loaded_worlds);
    setStorageCorrupted(corrupted);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveWorlds(worlds);
    setJustSaved(true);
    const t = setTimeout(() => setJustSaved(false), 1200);
    return () => clearTimeout(t);
  }, [worlds, loaded]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const addWorld = (w) => setWorlds((p) => [...p, w]);
  const deleteWorld = (id) => setWorlds((p) => p.filter((w) => w.id !== id));
  const updateWorld = (w) => setWorlds((p) => p.map((x) => (x.id === w.id ? w : x)));
  const addCharacter = (c) =>
    setWorlds((p) =>
      p.map((w) =>
        w.id === activeWorldId ? { ...w, characters: [...w.characters, c] } : w
      )
    );
  const updateCharacter = (c) =>
    setWorlds((p) =>
      p.map((w) =>
        w.id === activeWorldId
          ? { ...w, characters: w.characters.map((x) => (x.id === c.id ? c : x)) }
          : w
      )
    );

  const handleStartGenerating = () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setGenerating(true);
    setGenError(null);
    setGenAccumulated("");
  };

  const handleGenerated = (char) => {
    abortRef.current = null;
    setGenerating(false);
    addCharacter(char);
    setActiveCharId(char.id);
    setView("character");
  };

  const handleGenError = (msg) => {
    abortRef.current = null;
    setGenerating(false);
    setGenError(msg);
  };

  const handleNavigateAway = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setGenerating(false);
  };

  const handleExpand = async () => {
    if (!activeChar || !activeWorld) return;
    setExpanding(true);
    try {
      const raw = await callClaude(
        buildExpandPrompt(activeWorld, activeChar),
        "Expand this character."
      );
      const jsonStr = extractJson(raw);
      if (!jsonStr) throw new Error("No JSON in expand response");
      const parsed = JSON.parse(jsonStr);
      updateCharacter({ ...activeChar, ...parsed });
    } catch (err) {
      console.error("Expand failed", err);
    } finally {
      setExpanding(false);
    }
  };

  const handleResetStorage = () => {
    resetStorage();
    window.location.reload();
  };

  if (!loaded) {
    return (
      <>
        <div className="ambient" />
        <div className="app">
          <div className="screen" style={{ paddingTop: "4rem", textAlign: "center" }}>
            <p className="t-body">Loading…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="ambient" />

      {storageCorrupted && (
        <div style={{ position: "fixed", top: "1rem", left: "1.25rem", right: "1.25rem", zIndex: 600, maxWidth: "420px", margin: "0 auto" }}>
          <ErrorToast
            message="Saved data appears corrupted and couldn't be loaded."
            actions={
              <button type="button" className="error-toast-retry" onClick={handleResetStorage}>
                Reset storage
              </button>
            }
          />
        </div>
      )}

      {justSaved && (
        <div className="save-indicator">
          <span className="t-eyebrow" style={{ color: "var(--sage)" }}>Saved</span>
          <span className="save-dot" />
        </div>
      )}

      {generating && (
        <GeneratingOverlay phaseIdx={phaseIdx} doneIds={doneIds} verb={verb} justDone={justDone} />
      )}

      <TokenCounter />
      <div className="app">
        {view === "hub" && (
          <WorldHub
            worlds={worlds}
            onSelectWorld={(id) => { setActiveWorldId(id); setView("world"); }}
            onNewWorld={() => setView("createWorld")}
          />
        )}

        {view === "createWorld" && (
          <CreateWorldScreen
            onBack={() => setView("hub")}
            onCreate={(w) => { addWorld(w); setActiveWorldId(w.id); setView("world"); }}
          />
        )}

        {view === "world" && activeWorld && (
          <WorldDetail
            world={activeWorld}
            onBack={() => setView("hub")}
            onSelectCharacter={(id) => { setActiveCharId(id); setView("character"); }}
            onNewCharacter={() => { setGenError(null); setView("createCharacter"); }}
            onDelete={(id) => { deleteWorld(id); setView("hub"); }}
            onContinueInterview={
              activeWorld.mode === "advanced"
                ? () => setView("continueInterview")
                : undefined
            }
          />
        )}

        {view === "continueInterview" && activeWorld && (
          <CreateWorldAdvanced
            existingWorld={activeWorld}
            onDone={(updatedWorld) => { updateWorld(updatedWorld); setView("world"); }}
            onBack={() => setView("world")}
          />
        )}

        {view === "createCharacter" && activeWorld && (
          <>
            <CreateCharacterScreen
              world={activeWorld}
              onBack={() => { handleNavigateAway(); setView("world"); }}
              onStartGenerating={handleStartGenerating}
              onGenerated={handleGenerated}
              onError={handleGenError}
              onChunk={setGenAccumulated}
              signal={abortRef.current?.signal}
            />
            {genError && (
              <div style={{ position: "fixed", bottom: "7rem", left: "1.25rem", right: "1.25rem", zIndex: 500, maxWidth: "420px", margin: "0 auto" }}>
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
