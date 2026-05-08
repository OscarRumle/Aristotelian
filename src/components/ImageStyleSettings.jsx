import { useState } from "react";
import { IMAGE_STYLE_FIELDS, IMAGE_STYLE_DEFAULTS, getImageFieldLabel } from "../constants.js";

const ASSET_TYPES = [
  { id: "character", label: "Characters" },
  { id: "object",    label: "Objects" },
  { id: "location",  label: "Locations" },
  { id: "faction",   label: "Factions" },
];

export function ImageStyleSettings({ world, onUpdate }) {
  const [activeType, setActiveType] = useState("character");
  const styles = world?.imageStyles || {};
  const preset = styles[activeType] || IMAGE_STYLE_DEFAULTS[activeType] || {};

  const setField = (typeKey, fieldKey, value) => {
    onUpdate({
      ...world,
      imageStyles: {
        ...styles,
        [typeKey]: { ...(styles[typeKey] || {}), [fieldKey]: value },
      },
    });
  };

  const resetType = (typeKey) => {
    onUpdate({
      ...world,
      imageStyles: { ...styles, [typeKey]: { ...IMAGE_STYLE_DEFAULTS[typeKey] } },
    });
  };

  const setAutoGen = (next) => onUpdate({ ...world, autoGenerateImages: !!next });

  return (
    <div className="image-style-settings">
      <div className="image-style-settings-header">
        <p className="t-eyebrow">World defaults</p>
        <p className="image-style-settings-hint">
          Per-asset-type style applied to every new image generated for this world. Per-asset overrides live on each asset's "Edit prompt" panel.
        </p>
      </div>

      <label className="image-style-autogen">
        <input
          type="checkbox"
          checked={!!world?.autoGenerateImages}
          onChange={(e) => setAutoGen(e.target.checked)}
        />
        <span>Auto-generate images for new assets</span>
      </label>

      <div className="image-style-tabs" role="tablist">
        {ASSET_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className={`image-style-tab${activeType === t.id ? " is-active" : ""}`}
            aria-selected={activeType === t.id}
            onClick={() => setActiveType(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="image-style-fields">
        {IMAGE_STYLE_FIELDS.map(({ key }) => (
          <div key={key} className="image-style-field">
            <label className="image-style-label">{getImageFieldLabel(activeType, key)}</label>
            <input
              type="text"
              className="image-style-input"
              value={preset[key] ?? ""}
              placeholder={IMAGE_STYLE_DEFAULTS[activeType]?.[key] || ""}
              onChange={(e) => setField(activeType, key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="image-style-actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => resetType(activeType)}
        >
          Reset {ASSET_TYPES.find((t) => t.id === activeType)?.label.toLowerCase()} to defaults
        </button>
      </div>
    </div>
  );
}
