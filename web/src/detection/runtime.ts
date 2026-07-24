import { createAnswerTracker } from "./answerTracker";
import {
  createDemoOverlayDetector,
  createLatencyDetector,
  createPasteDetector,
} from "./behaviorDetectors";
import { createBlurDetector, createDisplayDetector, createVisibilityDetector } from "./environmentDetectors";
import { createGazeDetector } from "./gazeDetector";
import type { DetectorContext, SignalReporter } from "./types";

export interface RuntimeOptions {
  sessionId: string;
  tracker: import("./answerTracker").AnswerTracker;
  report: SignalReporter;
  consent: { camera: boolean; behavioral: boolean };
  getVideo: () => HTMLVideoElement | null;
  onSimulateOverlay: () => void;
}

export function startIntegrityRuntime(options: RuntimeOptions): () => void {
  const tracker = options.tracker;
  const getAnswering = () => tracker.isAnswering();

  const ctx: DetectorContext = {
    sessionId: options.sessionId,
    report: (payload) => {
      if (!options.consent.behavioral && payload.kind !== "demo_overlay_simulation") return;
      options.report(payload);
    },
    consent: options.consent,
  };

  const detectors = [
    createDisplayDetector(),
    createVisibilityDetector(getAnswering),
    createBlurDetector(getAnswering),
    createPasteDetector(tracker),
    createLatencyDetector(tracker),
    createGazeDetector(options.getVideo, getAnswering),
    createDemoOverlayDetector(options.onSimulateOverlay),
  ];

  const stops = detectors.map((d) => d.start(ctx));

  return () => {
    stops.forEach((stop) => stop());
  };
}

export { createAnswerTracker };
