"use client";

type OnboardingRevealCallback = () => void;

const onboardingRevealRegistry = new Map<string, Set<OnboardingRevealCallback>>();

function isVisibleTarget(element: HTMLElement) {
  if (!element.isConnected) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getOnboardingScrollContainers(element: HTMLElement) {
  const containers: HTMLElement[] = [];
  let current = element.parentElement;

  while (current) {
    if (
      current.matches("[data-onboarding-scroll-container='true'], [data-gamepad-scroll-container='true']")
    ) {
      containers.push(current);
    }

    current = current.parentElement;
  }

  return containers;
}

function revealTargetWithinContainer(container: HTMLElement, target: HTMLElement, padding: number) {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const topOverflow = targetRect.top - containerRect.top - padding;
  const bottomOverflow = targetRect.bottom - containerRect.bottom + padding;

  if (topOverflow < 0) {
    container.scrollTop += topOverflow;
  } else if (bottomOverflow > 0) {
    container.scrollTop += bottomOverflow;
  }
}

function revealTargetWithinViewport(target: HTMLElement, padding: number) {
  const rect = target.getBoundingClientRect();
  const topOverflow = rect.top - padding;
  const bottomOverflow = rect.bottom - window.innerHeight + padding;

  if (topOverflow < 0) {
    window.scrollBy({ top: topOverflow, behavior: "auto" });
  } else if (bottomOverflow > 0) {
    window.scrollBy({ top: bottomOverflow, behavior: "auto" });
  }
}

function isRectVisibleWithinBounds(
  rect: DOMRect,
  bounds: { top: number; right: number; bottom: number; left: number },
  padding: number,
) {
  return (
    rect.bottom > bounds.top + padding &&
    rect.top < bounds.bottom - padding &&
    rect.right > bounds.left + padding &&
    rect.left < bounds.right - padding
  );
}

function triggerOnboardingReveal(selector: string) {
  onboardingRevealRegistry.get(selector)?.forEach((callback) => callback());
}

export function resolveOnboardingTarget(selector: string | null) {
  if (!selector || typeof document === "undefined" || typeof window === "undefined") {
    return null;
  }

  const targets = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return targets.find(isVisibleTarget) ?? null;
}

export function hasOnboardingTarget(selector: string | null) {
  return resolveOnboardingTarget(selector) !== null;
}

export function registerOnboardingReveal(selector: string, callback: OnboardingRevealCallback) {
  const callbacks = onboardingRevealRegistry.get(selector) ?? new Set<OnboardingRevealCallback>();
  callbacks.add(callback);
  onboardingRevealRegistry.set(selector, callbacks);

  return () => {
    const currentCallbacks = onboardingRevealRegistry.get(selector);
    if (!currentCallbacks) {
      return;
    }

    currentCallbacks.delete(callback);
    if (currentCallbacks.size === 0) {
      onboardingRevealRegistry.delete(selector);
    }
  };
}

export function ensureOnboardingTargetVisible(
  selector: string | null,
  { padding = 16 }: { padding?: number } = {},
) {
  if (!selector || typeof window === "undefined") {
    return null;
  }

  let target = resolveOnboardingTarget(selector);

  if (!target) {
    triggerOnboardingReveal(selector);
    target = resolveOnboardingTarget(selector);
  }

  if (!target) {
    return null;
  }

  const containers = getOnboardingScrollContainers(target);
  containers.forEach((container) => revealTargetWithinContainer(container, target!, padding));
  revealTargetWithinViewport(target, padding);

  return target;
}

export function isOnboardingTargetReady(
  selector: string | null,
  { padding = 16 }: { padding?: number } = {},
) {
  const target = resolveOnboardingTarget(selector);
  if (!target) {
    return false;
  }

  const rect = target.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }

  const withinViewport = isRectVisibleWithinBounds(
    rect,
    { top: 0, right: window.innerWidth, bottom: window.innerHeight, left: 0 },
    padding,
  );

  if (!withinViewport) {
    return false;
  }

  const containers = getOnboardingScrollContainers(target);
  return containers.every((container) =>
    isRectVisibleWithinBounds(rect, container.getBoundingClientRect(), padding),
  );
}
