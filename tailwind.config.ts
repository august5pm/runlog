import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-elevated": "var(--color-surface-elevated)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
        foreground: "var(--color-text)",
        muted: "var(--color-text-muted)",
        subtle: "var(--color-text-subtle)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "accent-muted": "var(--color-accent-muted)",
        "accent-foreground": "var(--color-accent-foreground)",
        danger: "var(--color-danger)",
        success: "var(--color-success)",
        chart: {
          primary: "var(--color-chart-primary)",
          secondary: "var(--color-chart-secondary)",
          grid: "var(--color-chart-grid)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        numeric: ["var(--font-numeric)"],
      },
      fontSize: {
        display: "var(--text-display)",
        h1: "var(--text-h1)",
        h2: "var(--text-h2)",
        body: "var(--text-body)",
        caption: "var(--text-caption)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        fab: "var(--shadow-fab)",
      },
      borderRadius: {
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        input: "var(--radius-input)",
      },
    },
  },
  plugins: [],
};

export default config;
