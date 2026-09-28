import type { Config } from "tailwindcss";

// Los colores salen de las variables de tema en globals.css.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        mist: "rgb(var(--soft) / <alpha-value>)",
        pine: "rgb(var(--primary) / <alpha-value>)",
        "pine-dark": "rgb(var(--primary-dark) / <alpha-value>)",
        paper: "rgb(var(--page) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        income: "rgb(var(--income) / <alpha-value>)",
        expense: "rgb(var(--expense) / <alpha-value>)",
        savings: "rgb(var(--savings) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
      },
      fontSize: {
        title: ["clamp(1.5rem, 4vw, 2rem)", { lineHeight: "1.2" }],
      },
      keyframes: {
        driftA: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-8px) translateX(3px)" },
        },
        driftB: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-11px) translateX(-4px)" },
        },
        driftC: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        slideIn: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "30%": { transform: "translateX(-8px)" },
          "60%": { transform: "translateX(8px)" },
        },
      },
      animation: {
        "drift-a": "driftA 7s ease-in-out infinite",
        "drift-b": "driftB 9s ease-in-out infinite",
        "drift-c": "driftC 6.5s ease-in-out infinite",
        "slide-in": "slideIn 0.45s ease-out",
        shake: "shake 0.35s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
