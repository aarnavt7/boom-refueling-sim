"use client";

import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "#problem", label: "Problem" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#proof", label: "Proof" },
  { href: "#technology", label: "Tech" },
];

export function LandingNav() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-landing-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <Link href="/#main-content" className="group flex min-w-0 items-center gap-2">
          <Image src="/boom-logo.svg" alt="" width={28} height={28} className="shrink-0" priority />
          <span className="truncate font-sans text-[13px] font-semibold tracking-tight text-landing-fg">Boom</span>
        </Link>

        <nav
          className="flex max-w-[46vw] flex-wrap items-center justify-end gap-x-2.5 gap-y-1 md:max-w-none md:gap-6"
          aria-label="Primary"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="whitespace-nowrap font-sans text-[11px] font-medium text-landing-muted transition hover:text-landing-fg md:text-[13px]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/sim"
            className="rounded-full bg-ember px-3.5 py-2 font-sans text-[12px] font-semibold text-white shadow-[0_0_20px_rgba(227,107,23,0.22)] transition hover:bg-[#ea7a2c] sm:px-4"
          >
            Open sim
          </Link>
        </div>
      </div>
    </header>
  );
}
