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
        background: "var(--background)",
        foreground: "var(--foreground)",
        mint: "var(--color-mint)",
        bubblegum: "var(--color-bubblegum)",
        electric: "var(--color-electric)",
        cyber: "var(--color-cyber)",
        accent: "var(--color-mint)",
        "accent-hover": "var(--color-bubblegum)",
        "accent-active": "var(--color-electric)",
        "accent-light": "var(--color-cyber)",
        highlight: "var(--color-cyber)",
        "border-cyber": "var(--color-cyber)",
      },
      animation: {
        "fade-out": "1s fadeOut 3s ease-out forwards",
      },
      keyframes: {
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
