import type { Detector } from "./types";

export function createVisibilityDetector(getAnswering: () => boolean): Detector {
  return {
    name: "visibility",
    start(ctx) {
      let hiddenMs = 0;
      let interval: number | undefined;
      const onChange = () => {
        if (document.hidden && getAnswering()) hiddenMs += 500;
      };
      document.addEventListener("visibilitychange", onChange);
      interval = window.setInterval(() => {
        if (hiddenMs >= 2000) {
          ctx.report({
            kind: "visibility_hidden",
            weight: 12,
            message: "Browser tab was hidden for 2+ seconds while answering",
            evidence: { hiddenMs },
          });
          hiddenMs = 0;
        }
      }, 500);
      return () => {
        document.removeEventListener("visibilitychange", onChange);
        if (interval) window.clearInterval(interval);
      };
    },
  };
}

export function createBlurDetector(getAnswering: () => boolean): Detector {
  return {
    name: "blur",
    start(ctx) {
      let blurCount = 0;
      const onBlur = () => {
        if (getAnswering()) blurCount += 1;
      };
      window.addEventListener("blur", onBlur);
      const interval = window.setInterval(() => {
        if (blurCount >= 2) {
          ctx.report({
            kind: "window_blur",
            weight: 8,
            message: "Interview window lost focus repeatedly during an answer",
            evidence: { blurCount },
          });
          blurCount = 0;
        }
      }, 8000);
      return () => {
        window.removeEventListener("blur", onBlur);
        window.clearInterval(interval);
      };
    },
  };
}

export function createDisplayDetector(): Detector {
  return {
    name: "display",
    start(ctx) {
      const extended =
        "isExtended" in window.screen &&
        Boolean((window.screen as Screen & { isExtended?: boolean }).isExtended);
      const wide =
        window.screen.width - window.innerWidth > 400 ||
        window.screen.availWidth - window.innerWidth > 400;
      if (extended || wide) {
        ctx.report({
          kind: "multi_display",
          weight: 6,
          message: "Extended or very wide display layout detected (informational)",
          evidence: { extended, screenWidth: window.screen.width, innerWidth: window.innerWidth },
        });
      }
      return () => {};
    },
  };
}
