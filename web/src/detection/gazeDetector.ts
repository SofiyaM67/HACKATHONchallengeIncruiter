import type { Detector } from "./types";

function frameDiff(a: ImageData, b: ImageData, x0: number, x1: number): number {
  let sum = 0;
  const w = a.width;
  for (let y = 0; y < a.height; y += 4) {
    for (let x = x0; x < x1; x += 4) {
      const i = (y * w + x) * 4;
      sum +=
        Math.abs(a.data[i] - b.data[i]) +
        Math.abs(a.data[i + 1] - b.data[i + 1]) +
        Math.abs(a.data[i + 2] - b.data[i + 2]);
    }
  }
  return sum;
}

export function createGazeDetector(getVideo: () => HTMLVideoElement | null, getAnswering: () => boolean): Detector {
  return {
    name: "gaze",
    start(ctx) {
      if (!ctx.consent.camera) return () => {};
      const canvas = document.createElement("canvas");
      const g = canvas.getContext("2d", { willReadFrequently: true });
      if (!g) return () => {};
      let prev: ImageData | null = null;
      let offAxisSeconds = 0;
      const interval = window.setInterval(() => {
        const video = getVideo();
        if (!video || video.readyState < 2 || !getAnswering()) {
          offAxisSeconds = 0;
          prev = null;
          return;
        }
        const w = 160;
        const h = 120;
        canvas.width = w;
        canvas.height = h;
        g.drawImage(video, 0, 0, w, h);
        const frame = g.getImageData(0, 0, w, h);
        if (prev) {
          const left = frameDiff(prev, frame, 0, w / 3);
          const center = frameDiff(prev, frame, w / 3, (2 * w) / 3);
          if (center < left * 0.35 && left > 5000) offAxisSeconds += 2;
          else offAxisSeconds = Math.max(0, offAxisSeconds - 1);
          if (offAxisSeconds >= 8) {
            ctx.report({
              kind: "gaze_off_camera",
              weight: 14,
              message: "Sustained off-camera gaze while answering (webcam motion heuristic)",
              evidence: { offAxisSeconds, leftMotion: left, centerMotion: center },
            });
            offAxisSeconds = 0;
          }
        }
        prev = frame;
      }, 2000);
      return () => window.clearInterval(interval);
    },
  };
}
