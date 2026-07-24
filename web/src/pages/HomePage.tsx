import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createSession } from "../api/client";

export default function HomePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("Demo Candidate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const session = await createSession(name);
      navigate(`/reviewer/${session.id}`);
    } catch {
      setError("Could not create session. Start the server with npm start.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <header style={{ marginBottom: "1.5rem" }}>
        <p className="muted" style={{ margin: 0 }}>
          InCruiter · Interview Integrity
        </p>
        <h1 style={{ fontSize: "2rem" }}>Catch the invisible overlay — zero install</h1>
        <p className="muted" style={{ maxWidth: "62ch" }}>
          Browser-only mock interview with behavioral and environment signals, risk scoring, and a reviewer
          dashboard. Output is advisory — never an automatic rejection.
        </p>
      </header>

      <div className="grid-2">
        <section className="card">
          <h2>Start a session</h2>
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="name">Candidate display name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            {error && <p style={{ color: "var(--high)" }}>{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create session & open reviewer"}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>How to demo live cheating</h2>
          <ol className="muted" style={{ paddingLeft: "1.2rem", margin: 0 }}>
            <li>Open the candidate link on a second window/device.</li>
            <li>Accept consent on the candidate page.</li>
            <li>Ask a question from the reviewer view.</li>
            <li>
              On candidate: use <strong>Simulate overlay assist</strong> or paste a long answer after a pause.
            </li>
          </ol>
          <div className="disclaimer">
            We do not claim 100% detection of Cluely/Parakeet/FinalRound. Signals are defensible heuristics with
            documented limits.
          </div>
        </section>
      </div>

      <p className="muted" style={{ marginTop: "1.5rem" }}>
        Already have a session?{" "}
        <Link to="/" onClick={(e) => e.preventDefault()}>
          Paste session ID in the URL: /reviewer/&lt;id&gt; or /candidate/&lt;id&gt;
        </Link>
      </p>
    </div>
  );
}
