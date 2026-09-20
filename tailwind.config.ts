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
        rule: "var(--color-rule)",
        grey: {
          DEFAULT: "var(--color-grey)",
          light: "var(--color-grey-light)",
          dark: "var(--color-grey-dark)",
        },
        accent: {
          DEFAULT: "#BB1919",
          dark: "#8A1414",
          light: "#D2232A",
        },
      },
      // Editorial = serif (headlines + body). Chrome/labels = sans.
      fontFamily: {
        display: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
        body: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
        serif: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
        meta: ["var(--font-sans)", "Helvetica Neue", "Arial", "system-ui", "sans-serif"],
        ui: ["var(--font-sans)", "Helvetica Neue", "Arial", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "Helvetica Neue", "Arial", "system-ui", "sans-serif"],
      },
      // GEL type scale. Mobile size first; the -lg pairing is the sm:/lg: step.
      fontSize: {
        canon: ["28px", { lineHeight: "32px", letterSpacing: "-0.02em" }],
        "canon-lg": ["34px", { lineHeight: "38px", letterSpacing: "-0.02em" }],
        trafalgar: ["22px", { lineHeight: "26px", letterSpacing: "-0.015em" }],
        "trafalgar-lg": ["26px", { lineHeight: "30px", letterSpacing: "-0.015em" }],
        paragon: ["20px", { lineHeight: "24px", letterSpacing: "-0.01em" }],
        "paragon-lg": ["24px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
        "double-pica": ["18px", { lineHeight: "22px", letterSpacing: "-0.01em" }],
        "double-pica-lg": ["20px", { lineHeight: "24px", letterSpacing: "-0.01em" }],
        "body-copy": ["16px", { lineHeight: "22px" }],
        pica: ["16px", { lineHeight: "20px" }],
        brevier: ["14px", { lineHeight: "18px" }],
        "brevier-lg": ["15px", { lineHeight: "20px" }],
        minion: ["13px", { lineHeight: "16px" }],
        read: ["16px", { lineHeight: "24px" }],
        "read-lg": ["18px", { lineHeight: "26px" }],
      },
      // Zero radius everywhere; rounded-full survives for avatars and live dots.
      borderRadius: {
        none: "0",
        sm: "0",
        DEFAULT: "0",
        md: "0",
        lg: "0",
        xl: "0",
      },
      // No shadows anywhere; separation is hairlines + grey surface.
      boxShadow: {
        none: "none",
        sm: "none",
        DEFAULT: "none",
        md: "none",
        lg: "none",
      },
      maxWidth: {
        shell: "1280px",
        read: "39rem",
      },
    },
  },
  plugins: [],
};
export default config;






