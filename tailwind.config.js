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
        live: "var(--live)",
        gold: "var(--gold)",
        deepz: "var(--deep)",
        cool: "var(--cool)",
        payout: "var(--payout)",
        loss: "var(--loss)",
        free: "var(--free)"
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      },
      borderRadius: { card: "14px" },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)",
        cardHover: "0 4px 14px rgba(0,0,0,0.35), 0 10px 30px rgba(0,0,0,0.2)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
