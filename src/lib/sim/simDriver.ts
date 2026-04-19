/**
 * When both `variant="landing"` and `variant="capture"` canvases mount (e.g. home page),
 * only the capture canvas should advance the shared Zustand sim — otherwise useFrame runs twice per frame.
 */
let captureDriverCount = 0;

export function registerCaptureSimDriver(): () => void {
  captureDriverCount += 1;
  return () => {
    captureDriverCount = Math.max(0, captureDriverCount - 1);
  };
}

export function isCaptureSimDriverActive(): boolean {
  return captureDriverCount > 0;
}
