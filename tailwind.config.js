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
        loss: "var(--loss)",
        invested: "var(--invested)"
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      },
      // Strict type scale for the Overview redesign — additive only, does not
      // touch Tailwind's default xs/sm/base/lg/xl so other screens are unaffected.
      fontSize: {
        micro: ["0.625rem", { lineHeight: "1.4", letterSpacing: "0.08em" }], // 10px — eyebrow labels
        "data-xs": ["0.6875rem", { lineHeight: "1.4" }], // 11px — secondary data / timestamps
        "data-sm": ["0.8125rem", { lineHeight: "1.35" }], // 13px — body / table data
        "data-md": ["0.9375rem", { lineHeight: "1.3" }], // 15px — emphasized data
        "data-lg": ["1.125rem", { lineHeight: "1.2" }], // 18px
        "data-xl": ["1.5rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }], // 24px
        display: ["3rem", { lineHeight: "1", letterSpacing: "-0.02em" }] // 48px — one hero number per screen
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
