"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  getDefaultFocusTargetId,
  getNextFocusTargetId,
  getNextGroupTargetId,
  type FocusDirection,
  type FocusTarget,
} from "@/lib/gamepad/focus";
import {
  createGamepadInputMemory,
  pickPrimaryGamepad,
  sampleGamepadInput,
} from "@/lib/gamepad/normalize";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import { useGamepadStore } from "@/lib/store/gamepadStore";
import { useUiStore } from "@/lib/store/uiStore";
import type { GamepadUiMode } from "@/lib/sim/types";
import { HudButton, TacticalPanel } from "@/components/hud/tactical-ui";

type DomFocusTarget = FocusTarget & {
  element: HTMLElement;
  label: string;
  isDefault: boolean;
  isBackAction: boolean;
};

type ConnectionToast = {
  message: string;
  token: number;
};

function isFocusableDisabled(element: HTMLElement) {
  return (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true" ||
    element.getAttribute("data-gamepad-hidden") === "true"
  );
}

function collectDomFocusTargets(scope: GamepadUiMode): DomFocusTarget[] {
  if (typeof document === "undefined") {
    return [];
  }

  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>("[data-gamepad-focus-id]"),
  );

  return nodes
    .filter((element) => {
      if (isFocusableDisabled(element)) {
        return false;
      }

      const elementScope = (element.dataset.gamepadScope ?? "hud") as GamepadUiMode;
      if (elementScope !== scope) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })
    .map((element, index) => {
      const rect = element.getBoundingClientRect();
      return {
        element,
        id: element.dataset.gamepadFocusId ?? `focus-${index}`,
        group: element.dataset.gamepadGroup ?? "default",
        scope,
        order: index,
        rect: {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        },
        label:
          element.dataset.gamepadLabel ??
          element.getAttribute("aria-label") ??
          element.textContent?.trim() ??
          "Action",
        isDefault: element.dataset.gamepadDefault === "true",
        isBackAction: element.dataset.gamepadBackAction === "true",
      };
    });
}

function getPreferredDefaultTarget(targets: readonly DomFocusTarget[]) {
  const explicitDefault = targets.find((target) => target.isDefault);
  if (explicitDefault) {
    return explicitDefault;
  }

  const defaultId = getDefaultFocusTargetId(targets);
  return targets.find((target) => target.id === defaultId) ?? null;
}

function dispatchValueChange(element: HTMLElement, delta: number) {
  if (element instanceof HTMLSelectElement) {
    const nextIndex = Math.min(
      element.options.length - 1,
      Math.max(0, element.selectedIndex + delta),
    );

    if (nextIndex === element.selectedIndex) {
      return true;
    }

    element.selectedIndex = nextIndex;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  if (element instanceof HTMLInputElement && element.type === "range") {
    const step = Number(element.step || 1);
    const min = Number(element.min || 0);
    const max = Number(element.max || 100);
    const nextValue = Math.min(
      max,
      Math.max(min, Number(element.value) + delta * step),
    );

    if (nextValue === Number(element.value)) {
      return true;
    }

    element.value = String(nextValue);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  return false;
}

function activateElement(element: HTMLElement | null) {
  if (!element) {
    return;
  }

  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLAnchorElement ||
    element instanceof HTMLInputElement
  ) {
    element.click();
    return;
  }

  element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function getActiveElement() {
  if (typeof document === "undefined") {
    return null;
  }

  return document.activeElement instanceof HTMLElement ? document.activeElement : null;
}

function applyFocusedElement(element: HTMLElement | null, previous: HTMLElement | null) {
  if (previous && previous !== element) {
    delete previous.dataset.gamepadFocused;
  }

  if (!element) {
    return;
  }

  element.dataset.gamepadFocused = "true";
  element.focus({ preventScroll: true });
  element.scrollIntoView({
    block: "nearest",
    inline: "nearest",
  });
}

function findScrollContainer(element: HTMLElement | null) {
  return element?.closest<HTMLElement>("[data-gamepad-scroll-container='true']") ?? null;
}

function getContextActionLabel() {
  const uiState = useUiStore.getState();
  if (uiState.replayMode) {
    return uiState.replayPlaying ? "Pause replay" : "Play replay";
  }

  if (uiState.liveRunState === "running" && !uiState.manualAbort) {
    return "Queue breakaway";
  }

  return "Utility action";
}

function getModeHelp(mode: GamepadUiMode) {
  if (mode === "overlay") {
    return [
      ["D-pad / LS", "Move overlay focus"],
      ["A", "Confirm"],
      ["B", "Back or dismiss"],
      ["RB/LB", "Jump overlay groups"],
      ["RS", "Scroll active panel"],
    ] as const;
  }

  if (mode === "hud") {
    return [
      ["D-pad / LS", "Move HUD focus"],
      ["A", "Activate"],
      ["B", "Return to viewport"],
      ["RB/LB", "Jump panel groups"],
      ["RS", "Scroll active panel"],
    ] as const;
  }

  return [
    ["LS", "Pan and frame the scene"],
    ["RS", "Look around the refuel geometry"],
    ["LT / RT", "Zoom out / in"],
    ["A", "Focus the HUD"],
    ["Y", "Cycle camera modes"],
  ] as const;
}

function GamepadLegend() {
  const connected = useGamepadStore((state) => state.connected);
  const deviceType = useGamepadStore((state) => state.deviceType);
  const uiMode = useGamepadStore((state) => state.uiMode);
  const focusedLabel = useGamepadStore((state) => state.focusedLabel);
  const controllerHintsDismissed = useGamepadStore(
    (state) => state.controllerHintsDismissed,
  );
  const setControllerHintsDismissed = useGamepadStore(
    (state) => state.setControllerHintsDismissed,
  );
  const modeHelp = useMemo(() => getModeHelp(uiMode), [uiMode]);

  if (!connected || controllerHintsDismissed) {
    return null;
  }

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-30 w-[min(21rem,calc(100vw-1.5rem))]">
      <TacticalPanel
        title={deviceType === "xbox" ? "Xbox controller" : "Controller"}
        subtitle={uiMode === "viewport" ? "Viewport control" : uiMode === "hud" ? "HUD navigation" : "Overlay navigation"}
        className="rounded-[22px] shadow-[0_20px_56px_rgba(0,0,0,0.42)]"
        headerRight={
          <HudButton
            variant="ghost"
            data-gamepad-hidden="true"
            onClick={() => setControllerHintsDismissed(true)}
          >
            Hide
          </HudButton>
        }
      >
        <div className="space-y-3 px-4 py-4">
          <p className="font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
            {focusedLabel
              ? `Focused target: ${focusedLabel}.`
              : "Use the controller as an operator console for camera, replay, and mission actions."}
          </p>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 font-sans text-[11px]">
            {modeHelp.map(([keyLabel, description]) => (
              <div key={keyLabel} className="contents">
                <span className="rounded-full border border-[color:var(--hud-line)] px-2 py-0.5 text-[color:var(--hud-accent-fg)]">
                  {keyLabel}
                </span>
                <span className="self-center text-[color:var(--hud-fg)]">{description}</span>
              </div>
            ))}
            <div className="contents">
              <span className="rounded-full border border-[color:var(--hud-line)] px-2 py-0.5 text-[color:var(--hud-accent-fg)]">
                X
              </span>
              <span className="self-center text-[color:var(--hud-fg)]">{getContextActionLabel()}</span>
            </div>
          </div>
        </div>
      </TacticalPanel>
    </div>
  );
}

export function GamepadProvider({ children }: { children: ReactNode }) {
  const setConnection = useGamepadStore((state) => state.setConnection);
  const setInput = useGamepadStore((state) => state.setInput);
  const setUiMode = useGamepadStore((state) => state.setUiMode);
  const setFocusedTarget = useGamepadStore((state) => state.setFocusedTarget);
  const requestCameraReset = useGamepadStore((state) => state.requestCameraReset);
  const previousElementRef = useRef<HTMLElement | null>(null);
  const inputMemoryRef = useRef(createGamepadInputMemory());
  const rafRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [toast, setToast] = useState<ConnectionToast | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      applyFocusedElement(null, previousElementRef.current);
    };
  }, []);

  useEffect(() => {
    let previousSignature = "none";

    const focusTarget = (scope: GamepadUiMode, preferredId?: string | null) => {
      const targets = collectDomFocusTargets(scope);
      if (targets.length === 0) {
        applyFocusedElement(null, previousElementRef.current);
        previousElementRef.current = null;
        setFocusedTarget({ id: null, group: null, label: null });
        return null;
      }

      const target =
        (preferredId
          ? targets.find((candidate) => candidate.id === preferredId)
          : null) ?? getPreferredDefaultTarget(targets);

      if (!target) {
        return null;
      }

      applyFocusedElement(target.element, previousElementRef.current);
      previousElementRef.current = target.element;
      setFocusedTarget({
        id: target.id,
        group: target.group,
        label: target.label,
      });
      return target;
    };

    const performContextAction = () => {
      const uiState = useUiStore.getState();

      if (uiState.replayMode) {
        uiState.setReplayPlaying(!uiState.replayPlaying);
        return;
      }

      if (uiState.liveRunState === "running" && !uiState.manualAbort) {
        uiState.requestManualAbort();
      }
    };

    const step = () => {
      const gamepad = pickPrimaryGamepad(navigator.getGamepads?.());
      const { state, memory } = sampleGamepadInput(
        gamepad,
        inputMemoryRef.current,
        performance.now(),
      );
      inputMemoryRef.current = memory;
      setInput(state);
      setConnection({
        connected: state.connected,
        supported: state.supported,
        deviceType: state.deviceType,
        rawId: state.id,
      });

      const nextSignature = `${state.connected}:${state.deviceType}:${state.id ?? "none"}`;
      if (state.connected && previousSignature !== nextSignature) {
        const message =
          state.deviceType === "xbox" ? "Xbox controller connected" : "Controller connected";
        setToast({
          message,
          token: Date.now(),
        });
        if (toastTimerRef.current !== null) {
          window.clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = window.setTimeout(() => {
          setToast(null);
        }, 2400);
      }
      previousSignature = nextSignature;

      const store = useGamepadStore.getState();
      const overlayTargets = collectDomFocusTargets("overlay");
      const hudTargets = collectDomFocusTargets("hud");
      let mode = store.uiMode;

      if (overlayTargets.length > 0 && mode !== "overlay") {
        mode = "overlay";
        setUiMode("overlay");
        focusTarget("overlay");
      } else if (overlayTargets.length === 0 && mode === "overlay") {
        mode = hudTargets.length > 0 ? "hud" : "viewport";
        setUiMode(mode);
        if (mode === "hud") {
          focusTarget("hud");
        } else {
          applyFocusedElement(null, previousElementRef.current);
          previousElementRef.current = null;
          setFocusedTarget({ id: null, group: null, label: null });
        }
      }

      if (!state.connected) {
        if (useGamepadStore.getState().uiMode !== "viewport") {
          setUiMode("viewport");
          applyFocusedElement(null, previousElementRef.current);
          previousElementRef.current = null;
          setFocusedTarget({ id: null, group: null, label: null });
        }
        rafRef.current = window.requestAnimationFrame(step);
        return;
      }

      const activeElement =
        previousElementRef.current ??
        (mode === "overlay"
          ? getPreferredDefaultTarget(overlayTargets)?.element ?? null
          : getPreferredDefaultTarget(hudTargets)?.element ?? null);

      const moveFocus = (direction: FocusDirection) => {
        const targets = collectDomFocusTargets(mode === "overlay" ? "overlay" : "hud");
        if (targets.length === 0) {
          return;
        }

        const currentId = useGamepadStore.getState().focusedId;
        const nextId = getNextFocusTargetId({
          targets,
          currentId,
          direction,
        });
        const nextTarget = targets.find((target) => target.id === nextId);
        if (!nextTarget) {
          return;
        }

        applyFocusedElement(nextTarget.element, previousElementRef.current);
        previousElementRef.current = nextTarget.element;
        setFocusedTarget({
          id: nextTarget.id,
          group: nextTarget.group,
          label: nextTarget.label,
        });
      };

      const jumpGroup = (direction: "previous" | "next") => {
        const targets = collectDomFocusTargets(mode === "overlay" ? "overlay" : "hud");
        const nextId = getNextGroupTargetId({
          targets,
          currentGroup: useGamepadStore.getState().focusedGroup,
          direction,
        });
        const nextTarget = targets.find((target) => target.id === nextId);
        if (!nextTarget) {
          return;
        }

        applyFocusedElement(nextTarget.element, previousElementRef.current);
        previousElementRef.current = nextTarget.element;
        setFocusedTarget({
          id: nextTarget.id,
          group: nextTarget.group,
          label: nextTarget.label,
        });
      };

      if (state.actions.cycleCamera.justPressed) {
        const currentMode = useUiStore.getState().cameraMode;
        const order = ["dock-lock", "receiver-lock", "manual"] as const;
        const nextIndex = (order.indexOf(currentMode) + 1) % order.length;
        useUiStore.getState().setCameraMode(order[nextIndex]);
      }

      if (state.actions.recenter.justPressed) {
        requestCameraReset();
      }

      if (mode === "viewport") {
        if (state.actions.confirm.justPressed) {
          setUiMode("hud");
          focusTarget("hud");
        }

        if (state.actions.context.justPressed) {
          performContextAction();
        }

        rafRef.current = window.requestAnimationFrame(step);
        return;
      }

      const currentElement = getActiveElement() ?? activeElement;
      if (currentElement && previousElementRef.current !== currentElement) {
        previousElementRef.current = currentElement;
        setFocusedTarget({
          id: currentElement.dataset.gamepadFocusId ?? null,
          group: currentElement.dataset.gamepadGroup ?? null,
          label:
            currentElement.dataset.gamepadLabel ??
            currentElement.getAttribute("aria-label") ??
            currentElement.textContent?.trim() ??
            null,
        });
      } else if (!currentElement) {
        focusTarget(mode === "overlay" ? "overlay" : "hud");
      }

      const horizontalDelta =
        state.actions.moveRight.justPressed ||
        state.actions.moveRight.repeat
          ? 1
          : state.actions.moveLeft.justPressed || state.actions.moveLeft.repeat
            ? -1
            : 0;

      if (currentElement && horizontalDelta !== 0 && dispatchValueChange(currentElement, horizontalDelta)) {
        rafRef.current = window.requestAnimationFrame(step);
        return;
      }

      if (state.actions.moveUp.justPressed || state.actions.moveUp.repeat) {
        moveFocus("up");
      } else if (state.actions.moveDown.justPressed || state.actions.moveDown.repeat) {
        moveFocus("down");
      } else if (state.actions.moveLeft.justPressed || state.actions.moveLeft.repeat) {
        moveFocus("left");
      } else if (state.actions.moveRight.justPressed || state.actions.moveRight.repeat) {
        moveFocus("right");
      }

      if (state.actions.groupPrev.justPressed) {
        jumpGroup("previous");
      } else if (state.actions.groupNext.justPressed) {
        jumpGroup("next");
      }

      if (state.actions.confirm.justPressed) {
        activateElement(getActiveElement() ?? previousElementRef.current);
      }

      if (state.actions.back.justPressed) {
        const scopeTargets = collectDomFocusTargets(mode === "overlay" ? "overlay" : "hud");
        const backTarget = scopeTargets.find((target) => target.isBackAction);

        if (backTarget) {
          activateElement(backTarget.element);
        } else if (mode === "hud") {
          setUiMode("viewport");
          applyFocusedElement(null, previousElementRef.current);
          previousElementRef.current = null;
          setFocusedTarget({ id: null, group: null, label: null });
        }
      }

      if (state.actions.context.justPressed) {
        performContextAction();
      }

      const scrollContainer = findScrollContainer(getActiveElement() ?? previousElementRef.current);
      if (scrollContainer && Math.abs(state.rightStick.y) > 0.14) {
        scrollContainer.scrollBy({
          top: state.rightStick.y * 26,
          behavior: "auto",
        });
      }

      rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);

    const handleDisconnect = () => {
      applyFocusedElement(null, previousElementRef.current);
      previousElementRef.current = null;
      setUiMode("viewport");
      setFocusedTarget({ id: null, group: null, label: null });
    };

    window.addEventListener("gamepaddisconnected", handleDisconnect);
    return () => {
      window.removeEventListener("gamepaddisconnected", handleDisconnect);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    requestCameraReset,
    setConnection,
    setFocusedTarget,
    setInput,
    setUiMode,
  ]);

  const onboardingStatus = useOnboardingStore((state) => state.status);

  return (
    <>
      {children}
      <GamepadLegend />
      {toast ? (
        <div
          key={toast.token}
          className="pointer-events-none fixed right-4 top-16 z-30 rounded-full border border-[color:var(--hud-accent)]/45 bg-[color:var(--hud-panel)] px-3 py-2 font-sans text-[11px] font-medium tracking-[0.02em] text-[color:var(--hud-accent-fg)] shadow-[0_18px_48px_rgba(0,0,0,0.35)]"
          aria-live="polite"
        >
          {toast.message}
          {onboardingStatus === "welcome" ? " · onboarding ready" : ""}
        </div>
      ) : null}
    </>
  );
}
