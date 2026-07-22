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
        ink: "#1A1A1A",
        paper: "#FFFFFF",
        offwhite: "#F6F6F6",
        border: "#E2E2E2",
        grey: {
          DEFAULT: "#54595F",
          light: "#6D7176",
          dark: "#3B3E42",
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
