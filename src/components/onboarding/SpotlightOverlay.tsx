"use client";

import { useLayoutEffect, useMemo, useState } from "react";

import {
  ensureOnboardingTargetVisible,
  resolveOnboardingTarget,
} from "@/lib/onboarding/targeting";

type SpotlightOverlayProps = {
  selector: string | null;
  active: boolean;
  compact: boolean;
};

type ViewportState = {
  width: number;
  height: number;
};

type SpotlightState = {
  rect: DOMRect | null;
  viewport: ViewportState;
};

function getViewportState(): ViewportState {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function resolveTarget(selector: string | null) {
  if (!selector) {
    return null;
  }

  return resolveOnboardingTarget(selector);
}

function useSpotlightState(selector: string | null, active: boolean, compact: boolean) {
  const [state, setState] = useState<SpotlightState>({
    rect: null,
    viewport: getViewportState(),
  });

  useLayoutEffect(() => {
    if (!active) {
      setState({
        rect: null,
        viewport: getViewportState(),
      });
      return;
    }

    let target = resolveTarget(selector);
    const documentElement = typeof document !== "undefined" ? document.documentElement : null;
    let frameId = 0;
    let attempts = 0;
    const padding = compact ? 10 : 12;

    const update = () => {
      ensureOnboardingTargetVisible(selector, { padding });
      target = resolveTarget(selector);
      const nextRect = target?.getBoundingClientRect() ?? null;
      const nextViewport = getViewportState();

      setState((current) => {
        const currentRect = current.rect;
        const rectUnchanged =
          currentRect?.left === nextRect?.left &&
          currentRect?.top === nextRect?.top &&
          currentRect?.width === nextRect?.width &&
          currentRect?.height === nextRect?.height;
        const viewportUnchanged =
          current.viewport.width === nextViewport.width &&
          current.viewport.height === nextViewport.height;

        if (rectUnchanged && viewportUnchanged) {
          return current;
        }

        return {
          rect: nextRect,
          viewport: nextViewport,
        };
      });
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        update();
      });
    };

    const updateUntilResolved = () => {
      scheduleUpdate();
      attempts += 1;

      if (attempts < 8 && !resolveTarget(selector)) {
        frameId = window.requestAnimationFrame(updateUntilResolved);
      }
    };

    updateUntilResolved();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => scheduleUpdate()) : null;

    if (target) {
      resizeObserver?.observe(target);
    }
    if (documentElement) {
      resizeObserver?.observe(documentElement);
    }

    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
  }, [active, compact, selector]);

  return state;
}

export function SpotlightOverlay({ selector, active, compact }: SpotlightOverlayProps) {
  const { rect, viewport } = useSpotlightState(selector, active, compact);

  const padding = compact ? 10 : 12;
  const overlayStyle = useMemo(
    () =>
      ({
        backdropFilter: "blur(10px) brightness(0.45)",
        WebkitBackdropFilter: "blur(10px) brightness(0.45)",
        backgroundColor: "rgba(4, 6, 9, 0.48)",
      }) as const,
    [],
  );

  if (!active) {
    return null;
  }

  if (selector && (!rect || viewport.width === 0 || viewport.height === 0)) {
    return null;
  }

  if (!rect || viewport.width === 0 || viewport.height === 0) {
    return (
      <div className="pointer-events-auto fixed inset-0 z-30" aria-hidden="true">
        <div className="absolute inset-0" style={overlayStyle} />
      </div>
    );
  }

  const left = Math.max(0, rect.left - padding);
  const top = Math.max(0, rect.top - padding);
  const right = Math.min(viewport.width, rect.right + padding);
  const bottom = Math.min(viewport.height, rect.bottom + padding);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);

  return (
    <div className="pointer-events-auto fixed inset-0 z-30" aria-hidden="true">
      <div className="absolute left-0 top-0" style={{ ...overlayStyle, width: viewport.width, height: top }} />
      <div className="absolute left-0" style={{ ...overlayStyle, top, width: left, height }} />
      <div
        className="absolute"
        style={{ ...overlayStyle, top, left: right, width: Math.max(0, viewport.width - right), height }}
      />
      <div
        className="absolute left-0"
        style={{ ...overlayStyle, top: bottom, width: viewport.width, height: Math.max(0, viewport.height - bottom) }}
      />

      <div
        className="absolute rounded-[14px] bg-transparent transition-[left,top,width,height] duration-150 ease-out"
        style={{
          left,
          top,
          width,
          height,
        }}
      />

      <div
        className="pointer-events-none absolute rounded-[14px] border border-[color:var(--hud-accent)]/80 transition-[left,top,width,height] duration-150 ease-out"
        style={{
          left,
          top,
          width,
          height,
          boxShadow: "0 0 0 1px rgba(227, 107, 23, 0.22), 0 0 26px rgba(227, 107, 23, 0.18)",
        }}
      />
    </div>
  );
}
