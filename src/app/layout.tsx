import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";

import "./globals.css";

const ibmSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-sans",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Boom",
  title: {
    default: "Boom",
    template: "%s · Boom",
  },
  description: "Boom — browser refueling boom simulator (Next.js, React Three Fiber).",
  icons: {
    icon: [
      { url: "/boom-logo.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/boom-logo.svg"],
    apple: ["/boom-logo.svg"],
    other: [
      {
        rel: "mask-icon",
        url: "/boom-logo.svg",
        color: "#e36b17",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={ibmSans.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
