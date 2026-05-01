import type { Metadata, Viewport } from "next";

import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Pathlight",
  title: {
    default: "Pathlight",
    template: "%s · Pathlight",
  },
  description: "Pathlight — browser accessibility navigation digital twin for blind and low-vision travelers.",
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
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
