import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: {
    absolute: "Pathlight — accessibility navigation twin",
  },
  description: "Browser 3D accessibility navigation simulator for blind and low-vision travelers, with landmark-guided routing, hazard rerouting, and replay.",
  openGraph: {
    title: "Pathlight — accessibility navigation twin",
    description: "Compare baseline vs accessibility-aware routing in a 3D airport journey digital twin.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pathlight — accessibility navigation twin",
    description: "Browser accessibility navigation simulation with route comparison and replay.",
  },
};

export default function HomePage() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <LandingPage />
    </>
  );
}
