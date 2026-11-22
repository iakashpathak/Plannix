/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#0c1524", 900: "#0f1b2d", 800: "#182740", 700: "#2a3a57", 500: "#5a6783", 400: "#7d89a3", 300: "#a9b3c7" },
        paper: "#f4f6f9",
        line: "#e2e7ef",
        brand: { 50: "#e8f6f7", 100: "#c9ebee", 500: "#0f8791", 600: "#0b6f78", 700: "#0a5a62" },
        pending: { DEFAULT: "#b45309", soft: "#fdf1dc" },
        progress: { DEFAULT: "#2754c5", soft: "#e4ecfd" },
        done: { DEFAULT: "#0f7a4a", soft: "#dff4e9" },
        danger: { DEFAULT: "#b4232c", soft: "#fde8e9" },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Figtree", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: { pop: "0 12px 40px -12px rgba(15,27,45,.35)" },
    },
  },
  plugins: [],
};
