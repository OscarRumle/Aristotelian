/**
 * Small badge surfacing a count of unresolved [[...]] mentions.
 * Used at field level (compact) and entity level (with onClick to open queue).
 */
export function UnresolvedBadge({ count, onClick, label = "unresolved", compact = false }) {
  if (!count || count <= 0) return null;
  const text = compact ? `↪ ${count}` : `↪ ${count} ${label}`;
  if (onClick) {
    return (
      <button
        type="button"
        className={`unresolved-badge${compact ? " unresolved-badge--compact" : ""}`}
        onClick={onClick}
        title={`${count} ${label} mention${count > 1 ? 's' : ''} in this entity`}
      >
        {text}
      </button>
    );
  }
  return (
    <span className={`unresolved-badge${compact ? " unresolved-badge--compact" : ""}`}>
      {text}
    </span>
  );
}
