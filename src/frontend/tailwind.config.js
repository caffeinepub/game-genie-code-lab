/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "oklch(var(--popover) / <alpha-value>)",
          foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
        },
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
        neon: {
          green: "oklch(var(--neon-green) / <alpha-value>)",
          purple: "oklch(var(--neon-purple) / <alpha-value>)",
          pink: "oklch(var(--neon-pink) / <alpha-value>)",
          cyan: "oklch(var(--neon-cyan) / <alpha-value>)",
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        body: ['Figtree', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        neon: "0 0 20px oklch(var(--neon-green) / 0.4), 0 0 40px oklch(var(--neon-green) / 0.2)",
        "neon-purple": "0 0 20px oklch(var(--neon-purple) / 0.4), 0 0 40px oklch(var(--neon-purple) / 0.2)",
        "neon-pink": "0 0 20px oklch(var(--neon-pink) / 0.4), 0 0 40px oklch(var(--neon-pink) / 0.2)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        pulse_neon: {
          "0%, 100%": { boxShadow: "0 0 8px oklch(0.78 0.22 145 / 0.4)" },
          "50%": { boxShadow: "0 0 20px oklch(0.78 0.22 145 / 0.8), 0 0 40px oklch(0.78 0.22 145 / 0.4)" },
        },
        "slide-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        flicker: "flicker 3s ease-in-out infinite",
        pulse_neon: "pulse_neon 2s ease-in-out infinite",
        "slide-in-up": "slide-in-up 0.4s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
