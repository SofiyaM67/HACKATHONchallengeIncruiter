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

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 50) return "high";
  if (score >= 32) return "suspicious";
  return "clean";
}

export const SIGNAL_LABELS: Record<SignalKind, string> = {
  visibility_hidden: "Tab hidden during answer",
  window_blur: "Window focus lost",
  paste_burst: "Large paste into answer",
  latency_pattern: "Teleprompter-like delay then burst",
  gaze_off_camera: "Sustained off-camera gaze",
  multi_display: "Extended display detected (informational)",
  demo_overlay_simulation: "Demo: overlay read pattern",
  answer_round_complete: "Answer round completed",
};
