import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: {
    absolute: "Boom — refueling boom sim",
  },
  description: "Browser 3D refueling boom simulator — fly the rig, synthetic camera, replay. Next.js + React Three Fiber.",
  openGraph: {
    title: "Boom — refueling boom sim",
    description: "Dock with confidence. Open the sim to fly the boom in your browser.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Boom — refueling boom sim",
    description: "Browser refueling boom simulation with synthetic camera and replay.",
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
