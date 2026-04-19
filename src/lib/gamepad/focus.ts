import type { GamepadUiMode } from "@/lib/sim/types";

export type FocusDirection = "up" | "down" | "left" | "right";

export type FocusRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type FocusTarget = {
  id: string;
  group: string;
  scope: GamepadUiMode;
  order: number;
  rect: FocusRect;
};

function getCenter(rect: FocusRect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function axisDistance(
  direction: FocusDirection,
  current: ReturnType<typeof getCenter>,
  next: ReturnType<typeof getCenter>,
) {
  if (direction === "left") {
    return current.x - next.x;
  }

  if (direction === "right") {
    return next.x - current.x;
  }

  if (direction === "up") {
    return current.y - next.y;
  }

  return next.y - current.y;
}

function crossDistance(
  direction: FocusDirection,
  current: ReturnType<typeof getCenter>,
  next: ReturnType<typeof getCenter>,
) {
  if (direction === "left" || direction === "right") {
    return Math.abs(next.y - current.y);
  }

  return Math.abs(next.x - current.x);
}

function sortTargets(targets: readonly FocusTarget[]) {
  return [...targets].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    if (left.rect.top !== right.rect.top) {
      return left.rect.top - right.rect.top;
    }

    return left.rect.left - right.rect.left;
  });
}

export function getDefaultFocusTargetId(targets: readonly FocusTarget[]) {
  return sortTargets(targets)[0]?.id ?? null;
}

export function getNextFocusTargetId({
  targets,
  currentId,
  direction,
}: {
  targets: readonly FocusTarget[];
  currentId: string | null;
  direction: FocusDirection;
}) {
  if (targets.length === 0) {
    return null;
  }

  const sorted = sortTargets(targets);
  const current = sorted.find((target) => target.id === currentId) ?? sorted[0];
  const currentCenter = getCenter(current.rect);

  let bestScore = Number.POSITIVE_INFINITY;
  let bestTargetId: string | null = null;

  for (const candidate of sorted) {
    if (candidate.id === current.id) {
      continue;
    }

    const candidateCenter = getCenter(candidate.rect);
    const primary = axisDistance(direction, currentCenter, candidateCenter);
    if (primary <= 0) {
      continue;
    }

    const secondary = crossDistance(direction, currentCenter, candidateCenter);
    const score = primary * 12 + secondary + Math.abs(candidate.order - current.order) * 0.5;

    if (score < bestScore) {
      bestScore = score;
      bestTargetId = candidate.id;
    }
  }

  return bestTargetId ?? current.id;
}

export function getNextGroupTargetId({
  targets,
  currentGroup,
  direction,
}: {
  targets: readonly FocusTarget[];
  currentGroup: string | null;
  direction: "previous" | "next";
}) {
  if (targets.length === 0) {
    return null;
  }

  const groups = sortTargets(targets).reduce<string[]>((result, target) => {
    if (!result.includes(target.group)) {
      result.push(target.group);
    }
    return result;
  }, []);

  const currentIndex = currentGroup ? groups.indexOf(currentGroup) : -1;
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const delta = direction === "next" ? 1 : -1;
  const nextIndex = (safeIndex + delta + groups.length) % groups.length;
  const nextGroup = groups[nextIndex];

  return sortTargets(targets).find((target) => target.group === nextGroup)?.id ?? null;
}
