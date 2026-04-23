export function EmptyState({ quote, body }) {
  return (
    <div className="empty">
      <div className="empty-rule" />
      <p className="t-quote" style={{ maxWidth: 270 }}>{quote}</p>
      <p className="t-body" style={{ maxWidth: 250, textAlign: "center" }}>{body}</p>
      <div className="empty-rule" />
    </div>
  );
}
