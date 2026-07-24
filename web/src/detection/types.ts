import type { SignalKind } from "../shared/types";

export type SignalReporter = (payload: {
  kind: SignalKind;
  weight: number;
  message: string;
  evidence: Record<string, unknown>;
}) => void;

export interface DetectorContext {
  sessionId: string;
  report: SignalReporter;
  consent: {
    camera: boolean;
    behavioral: boolean;
  };
}

export interface Detector {
  name: string;
  start(ctx: DetectorContext): () => void;
}
