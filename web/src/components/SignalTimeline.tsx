import type { IntegritySignal } from "../shared/types";
import { SIGNAL_LABELS } from "../shared/types";

export function SignalTimeline({ signals }: { signals: IntegritySignal[] }) {
  if (signals.length === 0) {
    return <p className="muted">No integrity signals yet. Signals are advisory for human review.</p>;
  }
  return (
    <ul className="timeline">
      {[...signals].reverse().map((s) => (
        <li key={s.id}>
          <time>{new Date(s.at).toLocaleString()}</time>
          <strong>{SIGNAL_LABELS[s.kind] ?? s.kind}</strong>
          <div className="muted">{s.message}</div>
          <pre className="mono" style={{ fontSize: "0.72rem", margin: "0.35rem 0 0", opacity: 0.85 }}>
            {JSON.stringify(s.evidence, null, 2)}
          </pre>
        </li>
      ))}
    </ul>
  );
}
