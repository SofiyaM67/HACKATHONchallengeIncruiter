import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  completeAnswer,
  createSocket,
  fetchSessionBundle,
  postConsent,
  reportSignal,
  saveAnswerText,
} from "../api/client";
import { RiskBadge } from "../components/RiskBadge";
import { createAnswerTracker, startIntegrityRuntime } from "../detection/runtime";
import { useQuestionListener, useSessionChannel } from "../hooks/useSessionChannel";
import type { QuestionPayload, SignalKind } from "../shared/types";

const SAMPLE_QUESTIONS = [
  "Explain how you would design a rate limiter for a public API.",
  "Describe a production incident you resolved and what you learned.",
  "How does HTTPS differ from TLS termination at a load balancer?",
];

const PASTE_MIN_CHARS = 40;

export default function CandidatePage() {
  const { sessionId } = useParams();
  const { session, risk } = useSessionChannel(sessionId);
  const [consentCamera, setConsentCamera] = useState(true);
  const [consentBehavioral, setConsentBehavioral] = useState(true);
  const [consented, setConsented] = useState(false);
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [answer, setAnswer] = useState("");
  const [completing, setCompleting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackerRef = useRef(createAnswerTracker());
  const reportSocketRef = useRef(createSocket());
  const answerLenRef = useRef(0);
  const answerTextRef = useRef("");
  const questionIdRef = useRef<string | null>(null);
  const questionTextRef = useRef("");

  const persistAnswer = useCallback(
    async (answerText: string, status: "draft" | "final") => {
      if (!sessionId || !questionIdRef.current || !questionTextRef.current) return;
      await saveAnswerText(sessionId, {
        questionId: questionIdRef.current,
        questionText: questionTextRef.current,
        answerText,
        status,
      });
    },
    [sessionId]
  );

  const emitSignal = useCallback(
    (kind: SignalKind, weight: number, message: string, evidence: Record<string, unknown>) => {
      if (!sessionId || !consentBehavioral) return;
      reportSignal(reportSocketRef.current, sessionId, { kind, weight, message, evidence });
    },
    [sessionId, consentBehavioral]
  );

  const reportPaste = useCallback(
    (pastedChars: number, source: "clipboard" | "bulk_insert", snapshotText: string) => {
      if (!trackerRef.current.isAnswering()) return;
      emitSignal("paste_burst", 18, "Large pasted answer block during live response", {
        pastedChars,
        source,
        questionId: questionIdRef.current,
      });
      void persistAnswer(snapshotText, "draft");
    },
    [emitSignal, persistAnswer]
  );

  useEffect(() => {
    if (!sessionId) return;
    fetchSessionBundle(sessionId).then((b) => {
      if (b.session.consentAt) setConsented(true);
    });
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !consented) return;
    const socket = reportSocketRef.current;
    socket.emit("session:join", sessionId);

    const stop = startIntegrityRuntime({
      sessionId,
      tracker: trackerRef.current,
      consent: { camera: consentCamera, behavioral: consentBehavioral },
      getVideo: () => videoRef.current,
      onSimulateOverlay: () => {
        const sample =
          "A token-bucket rate limiter tracks tokens refilled at a steady rate per client key. Reject with 429 when empty, include Retry-After, and shard counters in Redis with TTL for horizontal scale.";
        window.setTimeout(() => {
          setAnswer(sample);
          answerTextRef.current = sample;
        }, 4500);
      },
      report: (payload) => reportSignal(socket, sessionId, payload),
    });

    return () => {
      stop();
    };
  }, [sessionId, consented, consentCamera, consentBehavioral]);

  useEffect(() => {
    const socket = reportSocketRef.current;
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!consented || !consentCamera) return;
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play();
        }
      })
      .catch(() => {});
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [consented, consentCamera]);

  const onQuestion = useCallback((q: QuestionPayload) => {
    setQuestion(q);
    setAnswer("");
    answerLenRef.current = 0;
    answerTextRef.current = "";
    questionIdRef.current = q.id;
    questionTextRef.current = q.text;
    trackerRef.current.onQuestionAsked(q.id, Date.parse(q.askedAt));
  }, []);

  useQuestionListener(sessionId, onQuestion);

  async function grantConsent(e: FormEvent) {
    e.preventDefault();
    if (!sessionId) return;
    await postConsent(sessionId);
    setConsented(true);
  }

  function onAnswerChange(value: string) {
    const prevLen = answerLenRef.current;
    const delta = value.length - prevLen;
    answerTextRef.current = value;
    if (delta >= PASTE_MIN_CHARS && trackerRef.current.isAnswering()) {
      reportPaste(delta, "bulk_insert", value);
    } else if (delta > 0) {
      trackerRef.current.onKeystroke();
    }
    answerLenRef.current = value.length;
    setAnswer(value);
  }

  function onAnswerPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = e.clipboardData.getData("text");
    if (pasted.length < PASTE_MIN_CHARS) return;
    const el = e.currentTarget;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const snapshot = el.value.slice(0, start) + pasted + el.value.slice(end);
    window.requestAnimationFrame(() => {
      reportPaste(pasted.length, "clipboard", snapshot);
    });
  }

  async function markAnswerComplete() {
    if (!sessionId || !question || completing) return;
    setCompleting(true);
    trackerRef.current.setAnswering(false);
    try {
      await completeAnswer(sessionId, {
        questionId: question.id,
        questionText: question.text,
        answerText: answer,
      });
    } finally {
      setQuestion(null);
      setAnswer("");
      answerLenRef.current = 0;
      answerTextRef.current = "";
      questionIdRef.current = null;
      questionTextRef.current = "";
      setCompleting(false);
    }
  }

  function simulateOverlay() {
    const fn = (window as Window & { __integritySimulateOverlay?: () => void }).__integritySimulateOverlay;
    fn?.();
    trackerRef.current.onQuestionAsked(question?.id ?? "sim", Date.now() - 5000);
  }

  if (!sessionId) return null;

  return (
    <div className="shell">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <p className="muted" style={{ margin: 0 }}>
            Candidate session
          </p>
          <h1 style={{ fontSize: "1.6rem" }}>{session?.candidateName ?? "Interview"}</h1>
        </div>
        <div className="row">
          {risk && <RiskBadge level={risk.level} />}
          <Link className="btn btn-secondary" to={`/reviewer/${sessionId}`}>
            Reviewer view
          </Link>
        </div>
      </div>

      {!consented ? (
        <section className="card">
          <h2>Consent</h2>
          <p className="muted">
            We only capture what you approve below. Data stays in this session for demo purposes and is not persisted
            to disk.
          </p>
          <form onSubmit={grantConsent}>
            <label className="row" style={{ marginBottom: "0.5rem" }}>
              <input type="checkbox" checked={consentBehavioral} onChange={(e) => setConsentBehavioral(e.target.checked)} />
              Behavioral signals (focus, tab visibility, typing patterns)
            </label>
            <label className="row" style={{ marginBottom: "1rem" }}>
              <input type="checkbox" checked={consentCamera} onChange={(e) => setConsentCamera(e.target.checked)} />
              Webcam heuristic for off-camera gaze (optional)
            </label>
            <button className="btn btn-primary" type="submit">
              I consent — join interview
            </button>
          </form>
        </section>
      ) : (
        <div className="grid-2">
          <section className="card">
            <h2>Live question</h2>
            {question ? (
              <>
                <p>{question.text}</p>
                <div className="field">
                  <label htmlFor="answer">Your answer</label>
                  <textarea
                    id="answer"
                    value={answer}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    onPaste={onAnswerPaste}
                    placeholder="Answer naturally — do not paste AI blocks unless demoing cheat behavior."
                  />
                </div>
                <div className="row">
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={completing}
                    onClick={() => void markAnswerComplete()}
                  >
                    {completing ? "Submitting…" : "Mark answer complete"}
                  </button>
                  <button className="btn btn-danger" type="button" onClick={simulateOverlay}>
                    Simulate overlay assist (demo)
                  </button>
                </div>
              </>
            ) : (
              <p className="muted">Waiting for the reviewer to ask a question…</p>
            )}
            <p className="muted" style={{ fontSize: "0.85rem", marginTop: "1rem" }}>
              Practice prompts: {SAMPLE_QUESTIONS.join(" · ")}
            </p>
          </section>

          <section className="card">
            <h2>Camera preview</h2>
            <div className="video-wrap">{consentCamera ? <video ref={videoRef} muted playsInline /> : <p className="muted">Camera off</p>}</div>
            <p className="muted" style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
              Current risk score: <span className="mono">{risk?.score ?? 0}</span> (advisory only)
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
