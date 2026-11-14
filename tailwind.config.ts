import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        lime: "#E0FB66",
        ivory: "#FDF9F3",
        lavender: "#EAE2FA",
        ink: "#080808",
      },
      fontFamily: {
        heading: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        technical: ["'Space Grotesk'", "sans-serif"],
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        "xs": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        "xs": "2px",
      },
    },
  },
  plugins: [],
} satisfies Config;
