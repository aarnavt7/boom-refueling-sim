const pipeline = [
  {
    step: "01",
    title: "Mission setup",
    body: "Pick the aircraft card, scenario, camera lock, and optional autonomy upload before launch.",
    icon: "scan",
  },
  {
    step: "02",
    title: "Passive track",
    body: "Visible + thermal acquisition and terminal sensors fused into one geometry-first receptacle track.",
    icon: "eye",
  },
  {
    step: "03",
    title: "Control + safety",
    body: "Staged controller, `moveECEF(...)` autopilot commands, and hold / abort / breakaway logic.",
    icon: "shield",
  },
  {
    step: "04",
    title: "Debrief",
    body: "Compare baseline, uploaded, and overlay replays with offset, closure, confidence, and safety analytics.",
    icon: "timeline",
  },
] as const;

function PipelineIcon({ name }: { name: (typeof pipeline)[number]["icon"] }) {
  const stroke = "currentColor";
  const className = "h-5 w-5 text-ember";
  switch (name) {
    case "scan":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" aria-hidden>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 5v2M12 17v2M5 12H3M21 12h-2M7 7l-1.5-1.5M18.5 18.5L17 17M7 17l-1.5 1.5M18.5 5.5L17 7" />
        </svg>
      );
    case "eye":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" aria-hidden>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "shield":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" aria-hidden>
          <path d="M12 3 4 6v6c0 5 3.5 9 8 10l.5.1.5-.1c4.5-1 8-5 8-10V6l-8-3Z" />
        </svg>
      );
    case "timeline":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" aria-hidden>
          <path d="M4 6h16M4 12h10M4 18h16" />
          <circle cx="18" cy="12" r="2" fill={stroke} stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

export function LandingPipelineCards() {
  return (
    <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {pipeline.map((row) => (
        <article
          key={row.step}
          className="relative flex flex-col rounded-2xl border border-landing-line bg-landing-elev/90 p-6 transition hover:border-ember/25"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="font-sans text-4xl font-bold tabular-nums leading-none text-ember">{row.step}</span>
            <PipelineIcon name={row.icon} />
          </div>
          <h3 className="mt-5 font-sans text-base font-semibold text-landing-fg">{row.title}</h3>
          <p className="mt-3 font-sans text-sm leading-relaxed text-landing-muted">{row.body}</p>
        </article>
      ))}
    </div>
  );
}
