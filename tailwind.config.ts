import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#16352A",
          light: "#23503F",
          dark: "#0E241C",
        },
        ochre: {
          DEFAULT: "#C1892E",
          light: "#DDAA5C",
        },
        clay: "#A64B2A",
        ivory: "#F1EEE4",
        ink: "#201D18",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-work-sans)", "system-ui", "sans-serif"],
        meta: ["var(--font-space-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
