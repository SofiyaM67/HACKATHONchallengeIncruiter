import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { askQuestion, fetchSessionBundle } from "../api/client";
import { RiskBadge } from "../components/RiskBadge";
import { SignalTimeline } from "../components/SignalTimeline";
import { AnswerArchive } from "../components/AnswerArchive";
import { useSessionChannel } from "../hooks/useSessionChannel";
import { LEVEL_CRITERIA, STRONG_SIGNAL_KINDS } from "../shared/riskCriteria";

const DEFAULT_QUESTIONS = [
  "Walk me through designing a rate limiter for a public API.",
  "Tell me about a difficult bug you fixed in production.",
  "Explain CAP tradeoffs for a payment ledger service.",
];

export default function ReviewerPage() {
  const { sessionId } = useParams();
  const { session, risk, answers } = useSessionChannel(sessionId);
  const [questionText, setQuestionText] = useState(DEFAULT_QUESTIONS[0]);
  const [copyOk, setCopyOk] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetchSessionBundle(sessionId).catch(() => setLoadError("Session not found."));
  }, [sessionId]);

  async function onAsk(e: FormEvent) {
    e.preventDefault();
    if (!sessionId) return;
    await askQuestion(sessionId, questionText);
  }

  async function copyCandidateLink() {
    if (!sessionId) return;
    const url = `${window.location.origin}/candidate/${sessionId}`;
    await navigator.clipboard.writeText(url);
    setCopyOk(true);
    window.setTimeout(() => setCopyOk(false), 2000);
  }

  if (!sessionId) return null;

  return (
    <div className="shell">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <p className="muted" style={{ margin: 0 }}>
            Reviewer dashboard
          </p>
          <h1 style={{ fontSize: "1.6rem" }}>{session?.candidateName ?? "Session"}</h1>
          <p className="mono muted" style={{ fontSize: "0.8rem" }}>
            {sessionId}
          </p>
        </div>
        <Link className="btn btn-secondary" to="/">
          Home
        </Link>
      </div>

      {loadError && <p style={{ color: "var(--high)" }}>{loadError}</p>}

      <div className="grid-2" style={{ marginBottom: "1rem" }}>
        <section className="card">
          <h2>Risk overview</h2>
          <div className="row" style={{ gap: "1rem" }}>
            <div className="score-ring">{risk?.score ?? 0}</div>
            {risk && <RiskBadge level={risk.level} />}
          </div>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Weighted score excludes informational events (extra monitor note, answer submitted). Level uses score plus
            strong signal types: {STRONG_SIGNAL_KINDS.join(", ")}.
          </p>
          <ul className="muted" style={{ fontSize: "0.9rem", paddingLeft: "1.1rem" }}>
            <li>
              <strong>Clean:</strong> {LEVEL_CRITERIA.clean}
            </li>
            <li>
              <strong>Suspicious:</strong> {LEVEL_CRITERIA.suspicious}
            </li>
            <li>
              <strong>High:</strong> {LEVEL_CRITERIA.high}
            </li>
          </ul>
        </section>

        <section className="card">
          <h2>Candidate link</h2>
          <p className="muted">Share this URL with the candidate (same machine or second device).</p>
          <div className="row">
            <button className="btn btn-primary" type="button" onClick={copyCandidateLink}>
              {copyOk ? "Copied" : "Copy candidate URL"}
            </button>
            <Link className="btn btn-secondary" to={`/candidate/${sessionId}`} target="_blank" rel="noreferrer">
              Open candidate
            </Link>
          </div>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Consent status: {session?.consentAt ? `granted ${new Date(session.consentAt).toLocaleString()}` : "pending"}
          </p>
        </section>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Ask a question</h2>
          <form onSubmit={onAsk}>
            <div className="field">
              <label htmlFor="q">Question text</label>
              <textarea id="q" value={questionText} onChange={(e) => setQuestionText(e.target.value)} required />
            </div>
            <div className="row" style={{ marginBottom: "0.75rem" }}>
              {DEFAULT_QUESTIONS.map((q) => (
                <button key={q} type="button" className="btn btn-secondary" onClick={() => setQuestionText(q)}>
                  Use sample
                </button>
              ))}
            </div>
            <button className="btn btn-primary" type="submit">
              Push question to candidate
            </button>
          </form>
        </section>

        <section className="card">
          <h2>Evidence timeline</h2>
          <SignalTimeline signals={risk?.signals ?? []} />
        </section>
      </div>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>Saved candidate answers</h2>
        <AnswerArchive answers={answers} />
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>Coverage & limits (honest)</h2>
        <div className="grid-2">
          <ul className="muted" style={{ margin: 0, paddingLeft: "1.1rem" }}>
            <li>Tab hidden / window blur during answers</li>
            <li>Large paste into answer field</li>
            <li>Long pause then typing burst (teleprompter read)</li>
            <li>Webcam motion heuristic for off-camera gaze</li>
            <li>Extended display hint (informational)</li>
          </ul>
          <ul className="muted" style={{ margin: 0, paddingLeft: "1.1rem" }}>
            <li>Cannot see stealth overlays directly (by design)</li>
            <li>Second monitor alone is not proof of cheating</li>
            <li>Gaze heuristic can false-positive on dual monitors</li>
            <li>No audio copilot or VM-level inspection</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
