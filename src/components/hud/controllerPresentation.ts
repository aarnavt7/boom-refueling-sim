/** Shared Guidance header chrome for DockingHud and marketing tactical mock. */
export function controllerTone(state: string): "ok" | "warn" | "danger" | "neutral" {
  if (state === "ABORT") return "danger";
  if (state === "BREAKAWAY") return "danger";
  if (state === "MATED" || state === "DOCKED") return "ok";
  if (state === "INSERT" || state === "HOLD") return "warn";
  return "neutral";
}

const controllerStateLabels: Record<string, string> = {
  SEARCH: "Search",
  ACQUIRE: "Acquire",
  TRACK: "Track",
  ALIGN: "Align",
  INSERT: "Insert",
  MATED: "Docked",
  HOLD: "Hold",
  DOCKED: "Docked",
  ABORT: "Abort",
  BREAKAWAY: "Breakaway",
};

export function formatControllerStateLabel(state: string): string {
  return (
    controllerStateLabels[state] ??
    state
      .toLowerCase()
      .split(/[_\s-]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export function guidanceHeaderStatusLabel(state: string): string {
  const tone = controllerTone(state);
  if (tone === "danger") return "Fault";
  if (tone === "ok") return "Captured";
  if (tone === "warn") return "Hot";
  return "Nominal";
}

export function guidanceHeaderStatusClass(state: string): string {
  const tone = controllerTone(state);
  if (tone === "danger") return "text-[color:var(--hud-danger)]";
  if (tone === "ok") return "text-[color:var(--hud-ok)]";
  if (tone === "warn") return "text-[color:var(--hud-warn)]";
  return "text-[color:var(--hud-muted)]";
}
