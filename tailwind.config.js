/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["2.5rem", { lineHeight: "1.2", fontWeight: "800" }],
        "display-md": ["2rem", { lineHeight: "1.25", fontWeight: "700" }],
        "display-sm": ["1.75rem", { lineHeight: "1.3", fontWeight: "600" }],
        "hero": ["3rem", { lineHeight: "1.1", fontWeight: "800" }],
      },
      colors: {
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        accent: "var(--accent)",
        "surface": "var(--card)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, var(--primary), var(--secondary))",
        "gradient-warm": "linear-gradient(135deg, var(--secondary), var(--accent))",
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
      },
    },
  },
  plugins: [],
}