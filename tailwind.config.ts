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
        display: ["var(--font-work-sans)", "Helvetica Neue", "Helvetica", "Arial", "system-ui", "sans-serif"],
        body: ["var(--font-work-sans)", "Helvetica Neue", "Helvetica", "Arial", "system-ui", "sans-serif"],
        meta: ["var(--font-work-sans)", "Helvetica Neue", "Helvetica", "Arial", "system-ui", "sans-serif"],
        serif: ["var(--font-source-serif)", "Georgia", "Times New Roman", "serif"],
      },
      fontSize: {
        // BBC-style type scale, mobile size shown; sm: prefix gives the desktop pairing
        canon: ["32px", { lineHeight: "36px" }],
        "canon-lg": ["44px", { lineHeight: "48px" }],
        trafalgar: ["24px", { lineHeight: "28px" }],
        "trafalgar-lg": ["32px", { lineHeight: "36px" }],
        paragon: ["22px", { lineHeight: "26px" }],
        "paragon-lg": ["28px", { lineHeight: "32px" }],
        "double-pica": ["20px", { lineHeight: "24px" }],
        "double-pica-lg": ["24px", { lineHeight: "28px" }],
        "body-copy": ["16px", { lineHeight: "22px" }],
        pica: ["16px", { lineHeight: "20px" }],
        brevier: ["14px", { lineHeight: "18px" }],
        "brevier-lg": ["13px", { lineHeight: "16px" }],
        minion: ["12px", { lineHeight: "16px" }],
        // Article reading copy — mirrors BBC's article body scale
        read: ["17px", { lineHeight: "28px" }],
        "read-lg": ["19px", { lineHeight: "31px" }],
      },
    },
  },
  plugins: [],
};
export default config;
