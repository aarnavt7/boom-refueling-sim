"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type FloatingHudPanelProps = {
  panelId: string;
  embedded?: boolean;
  className?: string;
  defaultPosition: {
    top: number;
    left?: number;
    right?: number;
  };
  children: (dragHandle: ReactNode) => ReactNode;
};

type StoredPanelPosition = {
  x: number;
  y: number;
};

const HUD_LAYOUT_STORAGE_KEY = "boom:hud-layout:v1";
const DESKTOP_BREAKPOINT = 1024;
const VIEWPORT_MARGIN = 12;
const DRAG_NUDGE_PX = 24;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function readStoredLayout() {
  if (typeof window === "undefined") {
    return {} as Record<string, StoredPanelPosition>;
  }

  try {
    const raw = window.localStorage.getItem(HUD_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return {} as Record<string, StoredPanelPosition>;
    }

    const parsed = JSON.parse(raw) as Record<string, Partial<StoredPanelPosition>>;
    const nextEntries = Object.entries(parsed).filter(
      ([, value]) =>
        typeof value?.x === "number" &&
        Number.isFinite(value.x) &&
        typeof value?.y === "number" &&
        Number.isFinite(value.y),
    );

    return Object.fromEntries(nextEntries) as Record<string, StoredPanelPosition>;
  } catch {
    return {} as Record<string, StoredPanelPosition>;
  }
}

function writeStoredLayout(panelId: string, position: StoredPanelPosition) {
  if (typeof window === "undefined") {
    return;
  }

  const current = readStoredLayout();
  current[panelId] = position;
  window.localStorage.setItem(HUD_LAYOUT_STORAGE_KEY, JSON.stringify(current));
}

function DragGripIcon() {
  return (
    <span className="grid grid-cols-2 gap-0.5" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <span
          key={index}
          className="h-1 w-1 rounded-full bg-current opacity-80"
        />
      ))}
    </span>
  );
}

export function FloatingHudPanel({
  panelId,
  embedded = false,
  className = "",
  defaultPosition,
  children,
}: FloatingHudPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<StoredPanelPosition | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const placementClassName = embedded ? "absolute" : "fixed";

  function clampPosition(candidate: StoredPanelPosition) {
    if (typeof window === "undefined") {
      return candidate;
    }

    const rect = panelRef.current?.getBoundingClientRect();
    const panelWidth = rect?.width ?? 352;
    const panelHeight = rect?.height ?? 320;
    const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - panelWidth - VIEWPORT_MARGIN);
    const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - panelHeight - VIEWPORT_MARGIN);

    return {
      x: clamp(candidate.x, VIEWPORT_MARGIN, maxX),
      y: clamp(candidate.y, VIEWPORT_MARGIN, maxY),
    };
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    function syncDesktopMode() {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    }

    syncDesktopMode();
    window.addEventListener("resize", syncDesktopMode);
    return () => window.removeEventListener("resize", syncDesktopMode);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setPosition(null);
      return;
    }

    function syncPosition() {
      setPosition((current) => {
        if (current) {
          return clampPosition(current);
        }

        const stored = readStoredLayout()[panelId];
        const rect = panelRef.current?.getBoundingClientRect();
        const panelWidth = rect?.width ?? 352;
        const defaultX =
          typeof defaultPosition.left === "number"
            ? defaultPosition.left
            : window.innerWidth - panelWidth - (defaultPosition.right ?? VIEWPORT_MARGIN);

        return clampPosition(
          stored ?? {
            x: defaultX,
            y: defaultPosition.top,
          },
        );
      });
    }

    const frame = window.requestAnimationFrame(syncPosition);
    window.addEventListener("resize", syncPosition);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", syncPosition);
    };
  }, [defaultPosition.left, defaultPosition.right, defaultPosition.top, isDesktop, panelId]);

  useEffect(() => {
    if (!isDesktop || !position) {
      return;
    }

    writeStoredLayout(panelId, position);
  }, [isDesktop, panelId, position]);

  const dragHandle = useMemo(
    () =>
      isDesktop ? (
        <button
          type="button"
          aria-label={`Drag ${panelId} panel`}
          title="Drag panel"
          className={`inline-flex h-7 w-7 touch-none items-center justify-center rounded-full border border-[color:var(--hud-line)]/70 bg-black/15 text-[color:var(--hud-muted)] transition hover:border-[color:var(--hud-accent)]/45 hover:text-[color:var(--hud-accent-fg)] ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          onPointerDown={(event) => {
            if (!position) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();

            const startPointerX = event.clientX;
            const startPointerY = event.clientY;
            const startPosition = position;
            const previousUserSelect = document.body.style.userSelect;
            const previousCursor = document.body.style.cursor;

            setIsDragging(true);
            document.body.style.userSelect = "none";
            document.body.style.cursor = "grabbing";

            function handlePointerMove(moveEvent: PointerEvent) {
              setPosition(
                clampPosition({
                  x: startPosition.x + moveEvent.clientX - startPointerX,
                  y: startPosition.y + moveEvent.clientY - startPointerY,
                }),
              );
            }

            function finishDrag() {
              document.body.style.userSelect = previousUserSelect;
              document.body.style.cursor = previousCursor;
              setIsDragging(false);
              window.removeEventListener("pointermove", handlePointerMove);
              window.removeEventListener("pointerup", finishDrag);
              window.removeEventListener("pointercancel", finishDrag);
            }

            window.addEventListener("pointermove", handlePointerMove);
            window.addEventListener("pointerup", finishDrag);
            window.addEventListener("pointercancel", finishDrag);
          }}
          onKeyDown={(event) => {
            if (!position) {
              return;
            }

            if (
              event.key !== "ArrowLeft" &&
              event.key !== "ArrowRight" &&
              event.key !== "ArrowUp" &&
              event.key !== "ArrowDown"
            ) {
              return;
            }

            event.preventDefault();

            const deltaX =
              event.key === "ArrowLeft"
                ? -DRAG_NUDGE_PX
                : event.key === "ArrowRight"
                  ? DRAG_NUDGE_PX
                  : 0;
            const deltaY =
              event.key === "ArrowUp"
                ? -DRAG_NUDGE_PX
                : event.key === "ArrowDown"
                  ? DRAG_NUDGE_PX
                  : 0;

            setPosition(
              clampPosition({
                x: position.x + deltaX,
                y: position.y + deltaY,
              }),
            );
          }}
        >
          <DragGripIcon />
        </button>
      ) : null,
    [isDesktop, isDragging, panelId, position],
  );

  if (!isDesktop || !position) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className={`pointer-events-auto ${placementClassName} ${className}`}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {children(dragHandle)}
    </div>
  );
}
