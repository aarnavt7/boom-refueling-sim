import type { Metadata } from "next";
import { Suspense } from "react";

import { MarketingShotsGallery } from "@/components/marketing/MarketingShotsGallery";

export const metadata: Metadata = {
  title: "Marketing captures",
  robots: { index: false, follow: false },
};

function ImgsGalleryFallback() {
  return (
    <div className="min-h-screen bg-[#050505] text-[color:var(--landing-fg)]">
      <div className="mx-auto max-w-4xl px-4 py-10 font-sans text-sm text-landing-muted">Loading…</div>
    </div>
  );
}

export default function MarketingImgsPage() {
  return (
    <Suspense fallback={<ImgsGalleryFallback />}>
      <MarketingShotsGallery />
    </Suspense>
  );
}
