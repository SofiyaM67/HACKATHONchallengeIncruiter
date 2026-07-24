import type { SavedAnswer } from "../shared/types";

export function AnswerArchive({ answers }: { answers: SavedAnswer[] }) {
  if (answers.length === 0) {
    return <p className="muted">No saved answers yet.</p>;
  }
  return (
    <ul className="timeline">
      {[...answers].reverse().map((a) => (
        <li key={`${a.questionId}-${a.updatedAt}`}>
          <time>{new Date(a.updatedAt).toLocaleString()}</time>
          <strong>{a.status === "final" ? "Submitted answer" : "Draft (e.g. after paste)"}</strong>
          <div className="muted" style={{ marginTop: "0.35rem" }}>
            Q: {a.questionText}
          </div>
          <pre
            className="mono"
            style={{
              fontSize: "0.78rem",
              margin: "0.5rem 0 0",
              whiteSpace: "pre-wrap",
              maxHeight: "160px",
              overflow: "auto",
            }}
          >
            {a.answerText || "(empty)"}
          </pre>
        </li>
      ))}
    </ul>
  );
}
