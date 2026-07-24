import type { IntegritySignal, RiskLevel, SignalKind } from "./types.js";
import { SIGNAL_WEIGHTS } from "./types.js";

export const INFORMATIONAL_KINDS: ReadonlySet<SignalKind> = new Set([
  "multi_display",
  "answer_round_complete",
]);

export const STRONG_KINDS: ReadonlySet<SignalKind> = new Set([
  "paste_burst",
  "latency_pattern",
  "demo_overlay_simulation",
]);

export function weightedScore(signals: IntegritySignal[]): number {
  return signals.reduce((sum, s) => {
    if (INFORMATIONAL_KINDS.has(s.kind)) return sum;
    return sum + (SIGNAL_WEIGHTS[s.kind] ?? s.weight);
  }, 0);
}

export function scoreToLevel(signals: IntegritySignal[]): RiskLevel {
  const score = weightedScore(signals);
  const strongCount = new Set(signals.filter((s) => STRONG_KINDS.has(s.kind)).map((s) => s.kind)).size;
  const hasPaste = signals.some((s) => s.kind === "paste_burst");

  if (hasPaste) {
    if (strongCount >= 2 || score >= 50) return "high";
    return "suspicious";
  }

  if (strongCount >= 2 || score >= 50) return "high";
  if (strongCount >= 1 && score >= 16) return "suspicious";
  if (score >= 32) return "suspicious";
  return "clean";
}

export const LEVEL_CRITERIA = {
  clean: "No strong cheat signals; weak/context-only events only.",
  suspicious: "Large paste during an answer immediately marks suspicious; or other strong/ combined signals per rules.",
  high: "Paste plus another strong signal type, or weighted score 50+.",
};
