import express from "express";
import cors from "cors";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { v4 as uuid } from "uuid";
import { SessionStore } from "./sessionStore.js";
import type { IntegritySignal, QuestionPayload, SavedAnswer } from "./types.js";
import { listenWithFallback } from "./listenWithFallback.js";
import { resolveCorsOrigins, corsOriginDelegate } from "./corsOrigins.js";

const corsOrigins = resolveCorsOrigins();
const corsDelegate = corsOriginDelegate(corsOrigins);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const store = new SessionStore();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins === true ? "*" : corsDelegate,
  },
});

app.use(
  cors({
    origin: corsOrigins === true ? true : corsDelegate,
  })
);
app.use(express.json());

const webDist = path.join(__dirname, "../../web/dist");
app.use(express.static(webDist));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "incruiter-integrity-api",
    health: "/health",
    sessions: "/api/sessions",
    note: "Use the Netlify frontend URL for the interview UI; this host is API-only.",
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/sessions", (req, res) => {
  const candidateName = String(req.body?.candidateName ?? "Candidate").trim() || "Candidate";
  const session = store.create({
    id: uuid(),
    candidateName,
    createdAt: new Date().toISOString(),
    consentAt: null,
    activeQuestionId: null,
  });
  res.json(session);
});

app.get("/api/sessions", (_req, res) => {
  res.json(store.listSessions());
});

app.get("/api/sessions/:id", (req, res) => {
  const session = store.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({ session, risk: store.snapshot(req.params.id), answers: store.getAnswers(req.params.id) });
});

app.post("/api/sessions/:id/consent", (req, res) => {
  const updated = store.update(req.params.id, { consentAt: new Date().toISOString() });
  if (!updated) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  io.to(`session:${req.params.id}`).emit("session:update", updated);
  res.json(updated);
});

app.post("/api/sessions/:id/questions", (req, res) => {
  const session = store.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const question: QuestionPayload = {
    id: uuid(),
    text: String(req.body?.text ?? "").trim(),
    askedAt: new Date().toISOString(),
  };
  if (!question.text) {
    res.status(400).json({ error: "question_required" });
    return;
  }
  store.update(req.params.id, { activeQuestionId: question.id });
  io.to(`session:${req.params.id}`).emit("question:asked", question);
  res.json(question);
});

app.put("/api/sessions/:id/answers", (req, res) => {
  const session = store.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const questionId = String(req.body?.questionId ?? "").trim();
  const questionText = String(req.body?.questionText ?? "").trim();
  const answerText = String(req.body?.answerText ?? "");
  const status = req.body?.status === "final" ? "final" : "draft";
  if (!questionId || !questionText) {
    res.status(400).json({ error: "question_required" });
    return;
  }
  const saved: SavedAnswer = {
    questionId,
    questionText,
    answerText,
    updatedAt: new Date().toISOString(),
    status,
  };
  const answers = store.saveAnswer(req.params.id, saved);
  io.to(`session:${req.params.id}`).emit("answers:update", answers);
  res.json({ answers });
});

app.post("/api/sessions/:id/answers/complete", (req, res) => {
  const session = store.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const questionId = String(req.body?.questionId ?? session.activeQuestionId ?? "");
  const questionText = String(req.body?.questionText ?? "").trim();
  const answerText = String(req.body?.answerText ?? "");
  const answerLength = answerText.length || Number(req.body?.answerLength ?? 0);
  if (questionId && questionText) {
    store.saveAnswer(req.params.id, {
      questionId,
      questionText,
      answerText,
      updatedAt: new Date().toISOString(),
      status: "final",
    });
  }
  store.update(req.params.id, { activeQuestionId: null });
  const updated = store.get(req.params.id);
  if (updated) io.to(`session:${req.params.id}`).emit("session:update", updated);
  const answers = store.getAnswers(req.params.id);
  io.to(`session:${req.params.id}`).emit("answers:update", answers);
  io.to(`session:${req.params.id}`).emit("answer:completed", {
    questionId,
    answerLength,
    completedAt: new Date().toISOString(),
  });
  const risk = ingestSignal({
    sessionId: req.params.id,
    kind: "answer_round_complete",
    weight: 0,
    message: "Candidate marked answer complete",
    evidence: { questionId, answerLength },
    at: new Date().toISOString(),
  });
  res.json({ ok: true, risk, answers });
});

app.post("/api/sessions/:id/signals", (req, res) => {
  const session = store.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const kind = req.body?.kind;
  if (!kind) {
    res.status(400).json({ error: "kind_required" });
    return;
  }
  const risk = ingestSignal({
    sessionId: req.params.id,
    kind,
    weight: Number(req.body?.weight ?? 0),
    message: String(req.body?.message ?? ""),
    evidence: (req.body?.evidence as Record<string, unknown>) ?? {},
    at: new Date().toISOString(),
  });
  res.json({ risk });
});

function ingestSignal(payload: Omit<IntegritySignal, "id">) {
  const signal: IntegritySignal = { ...payload, id: uuid() };
  const risk = store.addSignal(signal);
  io.to(`session:${payload.sessionId}`).emit("signal:new", signal);
  io.to(`session:${payload.sessionId}`).emit("risk:update", risk);
  return risk;
}

io.on("connection", (socket) => {
  socket.on("session:join", (sessionId: string) => {
    socket.join(`session:${sessionId}`);
    const risk = store.snapshot(sessionId);
    socket.emit("risk:update", risk);
    const session = store.get(sessionId);
    if (session) socket.emit("session:update", session);
    socket.emit("answers:update", store.getAnswers(sessionId));
  });

  socket.on("signal:report", (payload: Omit<IntegritySignal, "id">) => {
    if (!payload?.sessionId || !payload.kind) return;
    ingestSignal(payload);
  });
});

app.get("*", (_req, res) => {
  if (process.env.SERVE_WEB === "false") {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.sendFile(path.join(webDist, "index.html"), (err) => {
    if (err) res.status(404).send("Build the web app first (npm run build).");
  });
});

const preferredPort = Number(process.env.PORT ?? 3000);
const listen =
  process.env.RENDER === "true" || process.env.RAILWAY_ENVIRONMENT
    ? () => listenWithFallback(httpServer, preferredPort, 1)
    : () => listenWithFallback(httpServer, preferredPort);

listen()
  .then((port) => {
    if (port !== preferredPort) {
      console.warn(`Port ${preferredPort} in use; using http://localhost:${port}`);
    }
    console.log(`Integrity server listening on http://localhost:${port}`);
  })
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
