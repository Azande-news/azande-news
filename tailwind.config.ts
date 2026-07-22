import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        paper: "var(--color-paper)",
        offwhite: "var(--color-offwhite)",
        border: "var(--color-border)",
        grey: {
          DEFAULT: "var(--color-grey)",
          light: "var(--color-grey-light)",
          dark: "var(--color-grey-dark)",
        },
        accent: {
          DEFAULT: "#9E1B32",
          dark: "#7A1527",
          light: "#B8324A",
        },
      },
      fontFamily: {
        display: ["var(--font-work-sans)", "system-ui", "sans-serif"],
        body: ["var(--font-work-sans)", "system-ui", "sans-serif"],
        meta: ["var(--font-space-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
