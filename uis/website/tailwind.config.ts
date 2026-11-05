import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Space Grotesk", "ui-sans-serif", "sans-serif"] },
      colors: {
        primary: "#1E3A8A",
        secondary: "#3B82F6",
        accent: "#06B6D4",
        page: "#F8FAFC",
        ink: "#0F172A",
        ember: "#EE6C4D",
      },
    },
  },
  plugins: [],
} satisfies Config;
