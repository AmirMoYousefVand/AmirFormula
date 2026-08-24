import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FFC71F",
          hover: "#E6A800",
        },
        navy: {
          DEFAULT: "#1B2A4A",
          light: "#253A61",
        },
        silver: "#A7B0B7",
        body: "#5C6670",
      },
      fontFamily: {
        fa: ["var(--font-vazirmatn)", "Tahoma", "sans-serif"],
        en: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
