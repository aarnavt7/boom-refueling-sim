import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: {
    absolute: "Boom — refueling boom sim",
  },
  description: "Browser 3D refueling boom simulator with passive visible/thermal sensing, EMCON mission profiles, and ECEF-commanded autonomous boom control.",
  openGraph: {
    title: "Boom — refueling boom sim",
    description: "Dock with confidence. Open the sim to evaluate passive multispectral boom control in your browser.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Boom — refueling boom sim",
    description: "Browser refueling boom simulation with passive visible/thermal sensing and replay.",
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
