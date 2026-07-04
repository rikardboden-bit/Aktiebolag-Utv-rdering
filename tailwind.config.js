/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface-1)",
        plane: "var(--page-plane)",
        ink: "var(--text-primary)",
        "ink-2": "var(--text-secondary)",
        "ink-3": "var(--text-muted)",
        grid: "var(--gridline)",
        hairline: "var(--hairline)",
        accent: "var(--series-1)",
        "accent-2": "var(--series-2)",
        good: "var(--delta-good)",
        warn: "var(--status-warning)",
        crit: "var(--status-critical)",
      },
      borderRadius: {
        card: "1rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,11,11,0.04), 0 4px 16px rgba(11,11,11,0.05)",
      },
    },
  },
  plugins: [],
};
