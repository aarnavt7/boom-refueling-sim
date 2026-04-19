"use client";

import { useLayoutEffect, useMemo, useState } from "react";

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
  if (!selector || typeof document === "undefined") {
    return null;
  }

  return document.querySelector<HTMLElement>(selector);
}

function useSpotlightState(selector: string | null, active: boolean) {
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

    const update = () => {
      target = resolveTarget(selector);
      setState({
        rect: target?.getBoundingClientRect() ?? null,
        viewport: getViewportState(),
      });
    };

    update();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => update()) : null;

    if (target) {
      resizeObserver?.observe(target);
    }
    if (documentElement) {
      resizeObserver?.observe(documentElement);
    }

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active, selector]);

  return state;
}

export function SpotlightOverlay({ selector, active, compact }: SpotlightOverlayProps) {
  const { rect, viewport } = useSpotlightState(selector, active);

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
