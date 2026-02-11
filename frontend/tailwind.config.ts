import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Haupt-Palette
        ink:    "#0d0c0b",       // Fast-Schwarz
        paper:  "#f4ede0",       // Warmes Off-White
        amber:  "#c8863a",       // Bernstein-Akzent
        smoke:  "#1c1a17",       // Dunkel-Grau Cards
        mist:   "#2e2b26",       // Leicht heller für Hover
        dust:   "#6b6359",       // Gedämpftes Text
        cream:  "#e8dfd0",       // Sekundäres Warm-Weiß
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body:    ["var(--font-body)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        "2xs": "0.65rem",
      },
      letterSpacing: {
        widest2: "0.25em",
      },
      backgroundImage: {
        "grain": "url('/noise.svg')",
      },
      animation: {
        "fade-up":   "fadeUp 0.6s ease forwards",
        "fade-in":   "fadeIn 0.4s ease forwards",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
