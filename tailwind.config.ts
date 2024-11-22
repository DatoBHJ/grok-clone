import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        card: "rgb(var(--card))",
        "card-foreground": "rgb(var(--card-foreground))",
        popover: "rgb(var(--popover))",
        "popover-foreground": "rgb(var(--popover-foreground))",
        input: "rgb(var(--input))",
      },
      keyframes: {
        "slide-in-from-top-2": {
          "0%": { transform: "translateY(-2%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-from-bottom-2": {
          "0%": { transform: "translateY(2%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "in": "slide-in-from-top-2 0.2s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;