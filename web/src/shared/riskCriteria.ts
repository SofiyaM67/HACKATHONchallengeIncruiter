import type { RiskLevel } from "./types";

export const LEVEL_CRITERIA: Record<RiskLevel, string> = {
  clean: "No strong cheat signals; weak or informational events only.",
  suspicious: "Any large paste during an answer marks suspicious immediately; or other combined strong signals.",
  high: "Paste plus another strong signal, or weighted score 50+.",
};

export const STRONG_SIGNAL_KINDS = [
  "paste_burst",
  "latency_pattern",
  "demo_overlay_simulation",
] as const;
