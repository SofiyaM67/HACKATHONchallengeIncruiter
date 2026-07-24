export type RiskLevel = "clean" | "suspicious" | "high";

export type SignalKind =
  | "visibility_hidden"
  | "window_blur"
  | "paste_burst"
  | "latency_pattern"
  | "gaze_off_camera"
  | "multi_display"
  | "demo_overlay_simulation"
  | "answer_round_complete";

export interface IntegritySignal {
  id: string;
  sessionId: string;
  kind: SignalKind;
  weight: number;
  message: string;
  evidence: Record<string, unknown>;
  at: string;
}

export interface SessionMeta {
  id: string;
  candidateName: string;
  createdAt: string;
  consentAt: string | null;
  activeQuestionId: string | null;
}

export interface RiskSnapshot {
  sessionId: string;
  score: number;
  level: RiskLevel;
  signals: IntegritySignal[];
  updatedAt: string;
}

export interface QuestionPayload {
  id: string;
  text: string;
  askedAt: string;
}

export interface SavedAnswer {
  questionId: string;
  questionText: string;
  answerText: string;
  updatedAt: string;
  status: "draft" | "final";
}

export const SIGNAL_WEIGHTS: Record<SignalKind, number> = {
  visibility_hidden: 12,
  window_blur: 8,
  paste_burst: 18,
  latency_pattern: 15,
  gaze_off_camera: 14,
  multi_display: 0,
  demo_overlay_simulation: 25,
  answer_round_complete: 0,
};
