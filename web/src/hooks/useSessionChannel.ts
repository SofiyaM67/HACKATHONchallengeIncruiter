import { useEffect, useRef, useState } from "react";
import { createSocket, fetchSessionBundle } from "../api/client";
import type { QuestionPayload, RiskSnapshot, SavedAnswer, SessionMeta } from "../shared/types";
import type { Socket } from "socket.io-client";

export function useSessionChannel(sessionId: string | undefined) {
  const [session, setSession] = useState<SessionMeta | null>(null);
  const [risk, setRisk] = useState<RiskSnapshot | null>(null);
  const [answers, setAnswers] = useState<SavedAnswer[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetchSessionBundle(sessionId)
      .then((bundle) => {
        setSession(bundle.session);
        setRisk(bundle.risk);
        setAnswers(bundle.answers ?? []);
      })
      .catch(() => {});

    const socket = createSocket();
    socketRef.current = socket;
    socket.emit("session:join", sessionId);
    socket.on("session:update", setSession);
    socket.on("risk:update", setRisk);
    socket.on("answers:update", setAnswers);
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]);

  return { session, risk, answers };
}

export function useQuestionListener(sessionId: string | undefined, onQuestion: (q: QuestionPayload) => void) {
  useEffect(() => {
    if (!sessionId) return;
    const socket = createSocket();
    socket.emit("session:join", sessionId);
    socket.on("question:asked", onQuestion);
    return () => {
      socket.off("question:asked", onQuestion);
      socket.disconnect();
    };
  }, [sessionId, onQuestion]);
}
