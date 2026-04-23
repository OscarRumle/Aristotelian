export function PillSelect({ label, options, value, onChange, hint }) {
  return (
    <div>
      <label className="f-label">{label}</label>
      <div className="pill-group">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`pill ${value === o.value ? "active" : ""}`}
            aria-pressed={value === o.value}
            onClick={() => onChange(value === o.value ? "" : o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint && <p className="pill-desc">{hint}</p>}
    </div>
  );
}
