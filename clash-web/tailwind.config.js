/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#FFFFFF", dark: "#0A0A0A" },
        surface: { DEFAULT: "#F5F5F7", dark: "#121214" },
        txt: { DEFAULT: "#000000", dark: "#FFFFFF" },
        muted: { DEFAULT: "#6E6E73", dark: "#8E8E93" },
        border: { DEFAULT: "#E5E5EA", dark: "#2C2C2E" },
        accent: "#E30613",
      },
      borderRadius: { brutal: "4px" },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
