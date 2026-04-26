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
import { SceneDetail } from "./components/SceneDetail.jsx";
import { DialogueWriter } from "./components/DialogueWriter.jsx";
import { CastAnalysis } from "./components/CastAnalysis.jsx";
import { LoreExpandInterview } from "./components/LoreExpandInterview.jsx";
import { CreateObjectScreen } from "./components/CreateObjectScreen.jsx";
import { ObjectDetail } from "./components/ObjectDetail.jsx";
import { CreateFactionScreen } from "./components/CreateFactionScreen.jsx";
import { FactionDetail } from "./components/FactionDetail.jsx";
import { CreateLocationScreen } from "./components/CreateLocationScreen.jsx";
import { LocationDetail } from "./components/LocationDetail.jsx";
import { EntityHoverPreview } from "./components/EntityHoverPreview.jsx";

function findEntityInWorld(world, entityType, entityId) {
  if (!world || !entityId) return null;
  switch (entityType) {
    case 'character': return (world.characters ?? []).find((e) => e.id === entityId) ?? null;
    case 'object':    return (world.objects ?? []).find((e) => e.id === entityId) ?? null;
    case 'faction':   return (world.factions ?? []).find((e) => e.id === entityId) ?? null;
    case 'location':  return (world.locations ?? []).find((e) => e.id === entityId) ?? null;
    case 'lore':      return (world.documents ?? []).find((e) => e.id === entityId) ?? null;
    default:          return null;
  }
}

export default function App() {
  const [view, setView] = useState("hub");
  const [activeWorldId, setActiveWorldId] = useState(null);
  const [activeCharId, setActiveCharId] = useState(null);
  const [activeSceneId, setActiveSceneId] = useState(null);
  const [activeDialogueId, setActiveDialogueId] = useState(null);
  const [activeObjectId, setActiveObjectId] = useState(null);
  const [activeFactionId, setActiveFactionId] = useState(null);
  const [activeLocationId, setActiveLocationId] = useState(null);
  const [worlds, setWorlds] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [storageCorrupted, setStorageCorrupted] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [genError, setGenError] = useState(null);
  const [genAccumulated, setGenAccumulated] = useState("");
  const [castAnalysisOpen, setCastAnalysisOpen] = useState(false);
  const [castAnalysisText, setCastAnalysisText] = useState(null);
  const [createCharInitialPitch, setCreateCharInitialPitch] = useState("");
  const [worldToolView, setWorldToolView] = useState(null);
  const [activeLoreDocId, setActiveLoreDocId] = useState(null);
  const [activeCharTab, setActiveCharTab] = useState("overview");
  const [createRefContext, setCreateRefContext] = useState(null);

  const abortRef = useRef(null);

  const { phaseIdx, doneIds, verb, justDone } = useGeneratingProgress(generating, genAccumulated);

  const activeWorld = worlds.find((w) => w.id === activeWorldId);
  const activeChar = activeWorld?.characters.find((c) => c.id === activeCharId);
  const activeScene = activeWorld?.scenes?.find((s) => s.id === activeSceneId);

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
    const t = setTimeout(() => setJustSaved(false), 2500);
    return () => clearTimeout(t);
  }, [worlds, loaded]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  useEffect(() => {
    setActiveCharTab("overview");
  }, [activeCharId]);

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

  // Update a character without requiring it to be the active character (for color persistence)
  const updateWorldCharacter = (c) =>
    setWorlds((p) =>
      p.map((w) =>
        w.id === activeWorldId
          ? { ...w, characters: w.characters.map((x) => (x.id === c.id ? c : x)) }
          : w
      )
    );

  const updateDocument = (doc) =>
    setWorlds((p) =>
      p.map((w) =>
        w.id === activeWorldId
          ? { ...w, documents: (w.documents ?? []).map((d) => (d.id === doc.id ? doc : d)) }
          : w
      )
    );

  const addScene = (scene) =>
    setWorlds((p) =>
      p.map((w) =>
        w.id === activeWorldId ? { ...w, scenes: [...(w.scenes ?? []), scene] } : w
      )
    );

  const updateScene = (scene) =>
    setWorlds((p) =>
      p.map((w) =>
        w.id === activeWorldId
          ? { ...w, scenes: (w.scenes ?? []).map((s) => (s.id === scene.id ? scene : s)) }
          : w
      )
    );

  const addObject = (o) =>
    setWorlds((p) =>
      p.map((w) =>
        w.id === activeWorldId ? { ...w, objects: [...(w.objects ?? []), o] } : w
      )
    );

  const updateObject = (o) =>
    setWorlds((p) =>
      p.map((w) =>
        w.id === activeWorldId
          ? { ...w, objects: (w.objects ?? []).map((x) => (x.id === o.id ? o : x)) }
          : w
      )
    );

  const addFaction = (f) =>
    setWorlds((p) =>
      p.map((w) =>
        w.id === activeWorldId ? { ...w, factions: [...(w.factions ?? []), f] } : w
      )
    );

  const updateFaction = (f) =>
    setWorlds((p) =>
      p.map((w) =>
        w.id === activeWorldId
          ? { ...w, factions: (w.factions ?? []).map((x) => (x.id === f.id ? f : x)) }
          : w
      )
    );

  const addLocation = (l) =>
    setWorlds((p) =>
      p.map((w) =>
        w.id === activeWorldId ? { ...w, locations: [...(w.locations ?? []), l] } : w
      )
    );

  const updateLocation = (l) =>
    setWorlds((p) =>
      p.map((w) =>
        w.id === activeWorldId
          ? { ...w, locations: (w.locations ?? []).map((x) => (x.id === l.id ? l : x)) }
          : w
      )
    );

  const handleSaveDialogue = (dialogue) => {
    if (!activeScene) return;
    const existing = activeScene.dialogues?.find((d) => d.id === dialogue.id);
    const updatedDialogues = existing
      ? activeScene.dialogues.map((d) => (d.id === dialogue.id ? dialogue : d))
      : [...(activeScene.dialogues ?? []), dialogue];
    updateScene({ ...activeScene, dialogues: updatedDialogues });
  };

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

  const navigate = (entityType, entityId) => {
    switch (entityType) {
      case 'character': setActiveCharId(entityId); setView('character'); break;
      case 'object':    setActiveObjectId(entityId); setView('object'); break;
      case 'faction':   setActiveFactionId(entityId); setView('faction'); break;
      case 'location':  setActiveLocationId(entityId); setView('location'); break;
      case 'lore':      setActiveLoreDocId(entityId); setView('loreExpand'); break;
      default: break;
    }
  };

  const handleCreateFromRef = ({ entityType, name, sourceText, sourceEntityType, sourceEntityId, sourceFieldKey }) => {
    const sourceEntity = findEntityInWorld(activeWorld, sourceEntityType, sourceEntityId);
    const sourceName = sourceEntity?.name ?? sourceEntity?.title ?? '';
    setCreateRefContext({ name, sourceText, sourceName, sourceType: sourceEntityType, sourceFieldKey });
    switch (entityType) {
      case 'character': setGenError(null); setView('createCharacter'); break;
      case 'object':    setView('createObject'); break;
      case 'faction':   setView('createFaction'); break;
      case 'location':  setView('createLocation'); break;
      default: break;
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
        <GeneratingOverlay phaseIdx={phaseIdx} doneIds={doneIds} verb={verb} justDone={justDone} onCancel={handleNavigateAway} />
      )}

      {castAnalysisOpen && activeWorld && (
        <CastAnalysis
          world={activeWorld}
          onClose={() => setCastAnalysisOpen(false)}
          cachedText={castAnalysisText}
          onCacheText={setCastAnalysisText}
          onCreateCharacter={(pitch) => {
            setCastAnalysisOpen(false);
            setCreateCharInitialPitch(pitch);
            setGenError(null);
            setView("createCharacter");
          }}
        />
      )}

      <EntityHoverPreview />
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
            toolView={worldToolView}
            onSetToolView={setWorldToolView}
            onBack={() => { setWorldToolView(null); setView("hub"); }}
            onSelectCharacter={(id) => { setActiveCharId(id); setView("character"); }}
            onNewCharacter={() => { setGenError(null); setView("createCharacter"); }}
            onDelete={(id) => { deleteWorld(id); setWorldToolView(null); setView("hub"); }}
            onContinueInterview={() => setView("continueInterview")}
            onSelectScene={(id) => { setActiveSceneId(id); setView("scene"); }}
            onAddScene={(scene) => { addScene(scene); setActiveSceneId(scene.id); setView("scene"); }}
            onAnalyseCast={() => setCastAnalysisOpen(true)}
            onUpdateWorld={updateWorld}
            onUpdateDoc={updateDocument}
            onExpandDoc={(id) => { setActiveLoreDocId(id); setView("loreExpand"); }}
            onNewObject={() => setView("createObject")}
            onSelectObject={(id) => { setActiveObjectId(id); setView("object"); }}
            onNewFaction={() => setView("createFaction")}
            onSelectFaction={(id) => { setActiveFactionId(id); setView("faction"); }}
            onNewLocation={() => setView("createLocation")}
            onSelectLocation={(id) => { setActiveLocationId(id); setView("location"); }}
            onNavigate={navigate}
            onCreateFromRef={handleCreateFromRef}
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
              onBack={() => { handleNavigateAway(); setCreateCharInitialPitch(""); setCreateRefContext(null); setView("world"); }}
              onStartGenerating={handleStartGenerating}
              onGenerated={handleGenerated}
              onError={handleGenError}
              onChunk={setGenAccumulated}
              signal={abortRef.current?.signal}
              initialPitch={createCharInitialPitch}
              refContext={createRefContext}
              onRefContextConsumed={() => setCreateRefContext(null)}
            />
            {genError && (
              <div style={{ position: "fixed", bottom: "9rem", left: "1.25rem", right: "1.25rem", zIndex: 500, maxWidth: "420px", margin: "0 auto" }}>
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
            charTab={activeCharTab}
            onTabChange={setActiveCharTab}
            onNavigate={navigate}
            onCreateFromRef={handleCreateFromRef}
          />
        )}

        {view === "scene" && activeScene && activeWorld && (
          <SceneDetail
            scene={activeScene}
            world={activeWorld}
            onBack={() => setView("world")}
            onNewDialogue={() => { setActiveDialogueId(null); setView("dialogue"); }}
            onSelectDialogue={(id) => { setActiveDialogueId(id); setView("dialogue"); }}
            onUpdateScene={updateScene}
          />
        )}

        {view === "dialogue" && activeScene && activeWorld && (
          <DialogueWriter
            world={activeWorld}
            scene={activeScene}
            dialogueId={activeDialogueId}
            onBack={() => setView("scene")}
            onSaveDialogue={handleSaveDialogue}
            onUpdateCharacter={updateWorldCharacter}
            onNavigate={navigate}
            onCreateFromRef={handleCreateFromRef}
          />
        )}

        {view === "loreExpand" && activeLoreDocId && activeWorld && (
          <LoreExpandInterview
            world={activeWorld}
            doc={(activeWorld.documents ?? []).find((d) => d.id === activeLoreDocId)}
            onDone={(updatedDoc) => {
              updateDocument(updatedDoc);
              setWorldToolView("lore");
              setView("world");
            }}
            onBack={() => { setWorldToolView("lore"); setView("world"); }}
          />
        )}

        {view === "createObject" && activeWorld && (
          <CreateObjectScreen
            world={activeWorld}
            onBack={() => { setCreateRefContext(null); setView("world"); }}
            onSave={(o) => { addObject(o); setActiveObjectId(o.id); setView("object"); }}
            refContext={createRefContext}
            onRefContextConsumed={() => setCreateRefContext(null)}
          />
        )}

        {view === "object" && activeObjectId && activeWorld && (() => {
          const activeObject = (activeWorld.objects ?? []).find((o) => o.id === activeObjectId);
          return activeObject ? (
            <ObjectDetail
              object={activeObject}
              world={activeWorld}
              onBack={() => { setWorldToolView("objects"); setView("world"); }}
              onUpdate={updateObject}
              onNavigate={navigate}
              onCreateFromRef={handleCreateFromRef}
            />
          ) : null;
        })()}

        {view === "createFaction" && activeWorld && (
          <CreateFactionScreen
            world={activeWorld}
            onBack={() => { setCreateRefContext(null); setView("world"); }}
            onSave={(f) => { addFaction(f); setActiveFactionId(f.id); setView("faction"); }}
            refContext={createRefContext}
            onRefContextConsumed={() => setCreateRefContext(null)}
          />
        )}

        {view === "faction" && activeFactionId && activeWorld && (() => {
          const activeFaction = (activeWorld.factions ?? []).find((f) => f.id === activeFactionId);
          return activeFaction ? (
            <FactionDetail
              faction={activeFaction}
              world={activeWorld}
              onBack={() => { setWorldToolView("factions"); setView("world"); }}
              onUpdate={updateFaction}
              onNavigate={navigate}
              onCreateFromRef={handleCreateFromRef}
            />
          ) : null;
        })()}

        {view === "createLocation" && activeWorld && (
          <CreateLocationScreen
            world={activeWorld}
            onBack={() => { setCreateRefContext(null); setView("world"); }}
            onSave={(l) => { addLocation(l); setActiveLocationId(l.id); setView("location"); }}
            refContext={createRefContext}
            onRefContextConsumed={() => setCreateRefContext(null)}
          />
        )}

        {view === "location" && activeLocationId && activeWorld && (() => {
          const activeLocation = (activeWorld.locations ?? []).find((l) => l.id === activeLocationId);
          return activeLocation ? (
            <LocationDetail
              location={activeLocation}
              world={activeWorld}
              onBack={() => { setWorldToolView("locations"); setView("world"); }}
              onUpdate={updateLocation}
              onNavigate={navigate}
              onCreateFromRef={handleCreateFromRef}
            />
          ) : null;
        })()}
      </div>
    </>
  );
}
