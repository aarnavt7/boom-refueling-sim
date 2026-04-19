import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070a0e",
        steel: "#0c1118",
        line: "rgba(124, 144, 166, 0.22)",
        muted: "#8b98a8",
        accent: "#7eb3c8",
        ok: "#6fa68c",
        warn: "#c9a227",
        danger: "#c45a52",
        brand: "var(--brand-orange)",
        "landing-bg": "var(--landing-bg)",
        "landing-elev": "var(--landing-elev)",
        "landing-panel": "var(--landing-panel)",
        "landing-line": "var(--landing-line)",
        "landing-fg": "var(--landing-fg)",
        "landing-muted": "var(--landing-muted)",
        ember: "var(--landing-ember)",
        "ember-muted": "var(--landing-ember-muted)",
      },
      fontFamily: {
        sans: ["var(--font-ibm-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        hud: "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "radial-grid":
          "radial-gradient(ellipse 120% 70% at 50% 0%, rgba(126, 179, 200, 0.09), transparent 50%), linear-gradient(rgba(124, 144, 166, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 144, 166, 0.06) 1px, transparent 1px)",
        "landing-radial-grid":
          "radial-gradient(ellipse 100% 60% at 50% -15%, rgba(126, 179, 200, 0.06), transparent 50%), linear-gradient(var(--landing-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--landing-grid-line) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-lg": "100% 100%, 24px 24px, 24px 24px",
        "landing-grid": "100% 100%, 24px 24px, 24px 24px",
      },
    },
  },
  plugins: [],
};

export default config;
