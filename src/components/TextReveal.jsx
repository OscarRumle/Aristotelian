export function TextReveal({ text }) {
  const words = text.trim().split(/\s+/);
  const total = words.length;
  const maxDelay = Math.min(total * 18, 2500);

  return words.map((word, i) => (
    <span
      key={i}
      className="text-reveal-word"
      style={{ animationDelay: `${Math.round((i / Math.max(total - 1, 1)) * maxDelay)}ms` }}
    >
      {word}{" "}
    </span>
  ));
}
