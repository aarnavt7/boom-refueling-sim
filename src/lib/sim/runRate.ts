export const LIVE_RUN_RATE_OPTIONS = [0.5, 1, 1.5, 2] as const;

export type LiveRunRate = (typeof LIVE_RUN_RATE_OPTIONS)[number];

export const DEFAULT_LIVE_RUN_RATE: LiveRunRate = 1;

export function formatLiveRunRate(rate: number) {
  return `${rate.toFixed(1)}x`;
}

export function stepLiveRunRate(current: LiveRunRate, direction: -1 | 1): LiveRunRate {
  const currentIndex = LIVE_RUN_RATE_OPTIONS.indexOf(current);
  const safeIndex = currentIndex === -1 ? LIVE_RUN_RATE_OPTIONS.indexOf(DEFAULT_LIVE_RUN_RATE) : currentIndex;
  const nextIndex = Math.min(
    LIVE_RUN_RATE_OPTIONS.length - 1,
    Math.max(0, safeIndex + direction),
  );

  return LIVE_RUN_RATE_OPTIONS[nextIndex] ?? DEFAULT_LIVE_RUN_RATE;
}
