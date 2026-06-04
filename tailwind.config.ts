import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0b",
        surface: "#141417",
        surface2: "#1c1c21",
        border: "#26262d",
        muted: "#71717a",
        fg: "#f4f4f5",
        unreal: "#3B82F6",
        thefacio: "#10B981",
        global: "#71717a",
      },
    },
  },
  plugins: [],
} satisfies Config;
