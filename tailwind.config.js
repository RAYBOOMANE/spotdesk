/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "var(--void)",
        panel: "var(--panel)",
        panel2: "var(--panel2)",
        line: "var(--line)",
        line2: "var(--line2)",
        ink: "var(--ink)",
        dim: "var(--dim)",
        faint: "var(--faint)",
        profit: "var(--profit)",
        loss: "var(--loss)"
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      },
      borderRadius: { card: "18px" },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 8px 24px rgba(0,0,0,0.35)",
        cardHover: "0 1px 0 0 rgba(255,255,255,0.08) inset, 0 12px 32px rgba(0,0,0,0.4)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
