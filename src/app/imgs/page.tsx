import type { Metadata } from "next";

import { MarketingShotsGallery } from "@/components/marketing/MarketingShotsGallery";

export const metadata: Metadata = {
  title: "Marketing captures",
  robots: { index: false, follow: false },
};

export default function MarketingImgsPage() {
  return <MarketingShotsGallery />;
}
