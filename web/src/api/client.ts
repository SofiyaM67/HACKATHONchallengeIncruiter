import { io, Socket } from "socket.io-client";
import type { IntegritySignal, QuestionPayload, RiskSnapshot, SavedAnswer, SessionMeta } from "../shared/types";
import { apiOrigin, apiUrl } from "./config";

export function createSocket(): Socket {
  return io(apiOrigin(), {
    path: "/socket.io",
    transports: ["websocket", "polling"],
  });
}

export async function createSession(candidateName: string): Promise<SessionMeta> {
  const res = await fetch(apiUrl("/api/sessions"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateName }),
  });
  if (!res.ok) throw new Error("session_create_failed");
  return res.json();
}

export async function postConsent(sessionId: string): Promise<SessionMeta> {
  const res = await fetch(apiUrl(`/api/sessions/${sessionId}/consent`), { method: "POST" });
  if (!res.ok) throw new Error("consent_failed");
  return res.json();
}

export async function askQuestion(sessionId: string, text: string): Promise<QuestionPayload> {
  const res = await fetch(apiUrl(`/api/sessions/${sessionId}/questions`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("question_failed");
  return res.json();
}

export async function fetchSessionBundle(sessionId: string): Promise<{
  session: SessionMeta;
  risk: RiskSnapshot;
  answers: SavedAnswer[];
}> {
  const res = await fetch(apiUrl(`/api/sessions/${sessionId}`));
  if (!res.ok) throw new Error("session_not_found");
  return res.json();
}

export async function saveAnswerText(
  sessionId: string,
  body: {
    questionId: string;
    questionText: string;
    answerText: string;
    status?: "draft" | "final";
  }
): Promise<SavedAnswer[]> {
  const res = await fetch(apiUrl(`/api/sessions/${sessionId}/answers`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("save_answer_failed");
  const data = (await res.json()) as { answers: SavedAnswer[] };
  return data.answers;
}

export async function completeAnswer(
  sessionId: string,
  body: {
    questionId: string;
    questionText: string;
    answerText: string;
  }
): Promise<void> {
  const res = await fetch(apiUrl(`/api/sessions/${sessionId}/answers/complete`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("complete_failed");
}

export async function reportSignalHttp(
  sessionId: string,
  payload: Omit<IntegritySignal, "id" | "sessionId" | "at"> & { at?: string }
): Promise<RiskSnapshot> {
  const res = await fetch(apiUrl(`/api/sessions/${sessionId}/signals`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("signal_failed");
  const data = (await res.json()) as { risk: RiskSnapshot };
  return data.risk;
}

export function reportSignal(
  socket: Socket,
  sessionId: string,
  payload: Omit<IntegritySignal, "id" | "sessionId" | "at"> & { at?: string }
): void {
  const body = {
    ...payload,
    sessionId,
    at: payload.at ?? new Date().toISOString(),
  };
  if (import.meta.env.VITE_API_URL?.trim()) {
    void reportSignalHttp(sessionId, payload);
    return;
  }
  socket.emit("signal:report", body);
}
