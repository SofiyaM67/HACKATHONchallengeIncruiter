import type { AnswerTracker } from "./answerTracker";
import type { Detector } from "./types";

export function createLatencyDetector(tracker: AnswerTracker): Detector {
  return {
    name: "latency",
    start(ctx) {
      const interval = window.setInterval(() => {
        const state = tracker.getState();
        if (!state.answering || state.questionAskedAt === null || state.firstKeystrokeAt === null) {
          return;
        }
        const delay = state.firstKeystrokeAt - state.questionAskedAt;
        if (delay >= 4000 && state.keystrokesInBurst >= 40) {
          ctx.report({
            kind: "latency_pattern",
            weight: 15,
            message: "Long pause after question then rapid typing burst (overlay read pattern)",
            evidence: { delayMs: delay, keystrokesInBurst: state.keystrokesInBurst },
          });
          tracker.setAnswering(false);
        }
      }, 1500);
      return () => window.clearInterval(interval);
    },
  };
}

export function createPasteDetector(tracker: AnswerTracker): Detector {
  return {
    name: "paste",
    start(ctx) {
      const handler = (e: ClipboardEvent) => {
        if (!tracker.isAnswering()) return;
        const text = e.clipboardData?.getData("text") ?? "";
        if (text.length >= 40) {
          ctx.report({
            kind: "paste_burst",
            weight: 18,
            message: "Large pasted answer block during live response",
            evidence: { pastedChars: text.length },
          });
        }
      };
      document.addEventListener("paste", handler);
      return () => document.removeEventListener("paste", handler);
    },
  };
}

export function createDemoOverlayDetector(onSimulate: () => void): Detector {
  return {
    name: "demo_overlay",
    start(ctx) {
      (window as Window & { __integritySimulateOverlay?: () => void }).__integritySimulateOverlay =
        () => {
          onSimulate();
          ctx.report({
            kind: "demo_overlay_simulation",
            weight: 25,
            message: "Demo: teleprompter-style read pattern (simulated overlay assist)",
            evidence: { simulated: true },
          });
        };
      return () => {
        delete (window as Window & { __integritySimulateOverlay?: () => void }).__integritySimulateOverlay;
      };
    },
  };
}
