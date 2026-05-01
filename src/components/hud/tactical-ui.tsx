"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { formatControllerStateLabel } from "@/components/hud/controllerPresentation";

export function TacticalPanel({
  title,
  subtitle,
  children,
  className = "",
  bodyClassName = "",
  scrollBody = false,
  headerRight,
  headerActions,
  panelDragHandle,
  ...props
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  scrollBody?: boolean;
  headerRight?: ReactNode;
  headerActions?: ReactNode;
  panelDragHandle?: ReactNode;
} & ComponentPropsWithoutRef<"section">) {
  return (
    <section
      {...props}
      className={`relative flex min-h-0 flex-col overflow-hidden rounded-[var(--hud-radius-panel)] border border-[color:var(--hud-line)] bg-[color:var(--hud-panel)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:14px_14px]" />
      <header className="relative shrink-0 flex items-start justify-between gap-3 border-b border-[color:var(--hud-line)] px-3 pb-2 pt-2.5">
        <div className="min-w-0">
          <p className="font-sans text-[11px] font-medium leading-none tracking-[0.03em] text-[color:var(--hud-muted)]">
            {title}
          </p>
          {subtitle ? (
            <h2 className="mt-1 truncate font-sans text-sm font-medium leading-tight tracking-tight text-[color:var(--hud-fg)]">
              {subtitle}
            </h2>
          ) : null}
        </div>
        {headerRight || headerActions || panelDragHandle ? (
          <div className="shrink-0 flex items-start gap-2">
            {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
            {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
            {panelDragHandle ? <div className="shrink-0">{panelDragHandle}</div> : null}
          </div>
        ) : null}
      </header>
      <div
        data-gamepad-scroll-container={scrollBody ? "true" : undefined}
        className={`relative min-h-0 flex-1 ${
          scrollBody
            ? "overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]"
            : ""
        } ${bodyClassName}`}
      >
        {children}
      </div>
    </section>
  );
}

export function ViewportFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[var(--hud-radius-panel)] bg-black ${className}`}>
      <span className="pointer-events-none absolute left-2 top-2 z-10 h-4 w-4 border-l-2 border-t-2 border-[color:var(--hud-accent)]/80" />
      <span className="pointer-events-none absolute right-2 top-2 z-10 h-4 w-4 border-r-2 border-t-2 border-[color:var(--hud-accent)]/80" />
      <span className="pointer-events-none absolute bottom-2 left-2 z-10 h-4 w-4 border-b-2 border-l-2 border-[color:var(--hud-accent)]/80" />
      <span className="pointer-events-none absolute bottom-2 right-2 z-10 h-4 w-4 border-b-2 border-r-2 border-[color:var(--hud-accent)]/80" />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-[color:var(--hud-line)] ring-inset" />
      {children}
    </div>
  );
}

export function KvTable({ rows }: { rows: { k: string; v: string; warn?: boolean }[] }) {
  return (
    <div className="divide-y divide-[color:var(--hud-line)] font-sans text-xs tabular-nums">
      {rows.map((row) => (
        <div key={row.k} className="flex items-baseline justify-between gap-4 px-3 py-1.5">
          <span className="shrink-0 text-[11px] font-medium tracking-[0.02em] text-[color:var(--hud-muted)]">
            {row.k}
          </span>
          <span
            className={`min-w-0 truncate text-right text-[color:var(--hud-fg)] ${
              row.warn ? "text-[color:var(--hud-warn)]" : ""
            }`}
          >
            {row.v}
          </span>
        </div>
      ))}
    </div>
  );
}

export function StagePipeline({
  sequence,
  active,
}: {
  sequence: readonly string[];
  active: string;
}) {
  const activeIndex = sequence.indexOf(active);

  return (
    <div className="flex w-full flex-wrap gap-0 overflow-hidden rounded-[var(--hud-radius-control)] border border-[color:var(--hud-line)] bg-black/25 font-sans text-[11px] font-medium tracking-[0.02em]">
      {sequence.map((stage, index) => {
        const isActive = stage === active;
        const isPast = activeIndex !== -1 && index < activeIndex && stage !== "ABORT";
        const isAbort = stage === "ABORT" && isActive;

        return (
          <div
            key={stage}
            className={`relative flex min-h-[2rem] flex-1 items-center justify-center border-r border-[color:var(--hud-line)] px-2 py-1.5 last:border-r-0 ${
              isActive
                ? isAbort
                  ? "bg-[color:var(--hud-danger)]/18 text-[color:var(--hud-danger-fg)]"
                  : "bg-[color:var(--hud-accent)]/14 text-[color:var(--hud-accent-fg)]"
                : isPast
                  ? "text-[color:var(--hud-muted)]"
                  : "text-[color:var(--hud-muted)]/70"
            }`}
          >
            {isActive ? (
              <span className="absolute inset-x-0 top-0 h-px bg-[color:var(--hud-accent)]/55" />
            ) : null}
            <span className="text-center leading-tight">{formatControllerStateLabel(stage)}</span>
          </div>
        );
      })}
    </div>
  );
}

export const HudButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost" | "danger";
  }
>(function HudButton({
  children,
  variant = "ghost",
  ...props
}, ref) {
  const base =
    "inline-flex items-center justify-center rounded-[var(--hud-radius-control)] px-3 py-1.5 font-sans text-[11px] font-medium tracking-[0.02em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--hud-accent)] disabled:pointer-events-none disabled:opacity-40";
  const styles =
    variant === "primary"
      ? "border border-[color:var(--hud-accent)] bg-[color:var(--hud-accent)]/20 text-[color:var(--hud-accent-fg)] hover:bg-[color:var(--hud-accent)]/30"
      : variant === "danger"
        ? "border border-[color:var(--hud-danger)]/55 bg-[color:var(--hud-danger)]/12 text-[color:var(--hud-danger-fg)] hover:bg-[color:var(--hud-danger)]/20"
        : "border border-[color:var(--hud-line)] bg-black/20 text-[color:var(--hud-fg)] hover:border-[color:var(--hud-accent)]/45 hover:text-[color:var(--hud-accent-fg)]";

  return (
    <button ref={ref} type="button" className={`${base} ${styles}`} {...props}>
      {children}
    </button>
  );
});

HudButton.displayName = "HudButton";

export const HudIconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(function HudIconButton({ children, className = "", ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--hud-line)]/70 bg-black/20 font-sans text-[14px] font-medium leading-none text-[color:var(--hud-muted)] transition hover:border-[color:var(--hud-accent)]/45 hover:text-[color:var(--hud-accent-fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--hud-accent)] disabled:pointer-events-none disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

HudIconButton.displayName = "HudIconButton";

export function SegmentedBar({ value }: { value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="space-y-1 px-3 py-2">
      <div className="flex items-center justify-between font-sans text-[11px] font-medium tracking-[0.02em] text-[color:var(--hud-muted)]">
        <span>Track confidence</span>
        <span className="tabular-nums text-[color:var(--hud-fg)]">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full border border-[color:var(--hud-line)] bg-black/40">
        <div
          className="h-full rounded-full bg-[color:var(--hud-accent)]"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}
