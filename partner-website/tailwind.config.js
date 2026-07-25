/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        foam: "#faf8f5",
        sand: {
          DEFAULT: "#f1ebe2",
          deep: "#e2d6c6",
        },
        ocean: {
          DEFAULT: "#2f6f7e",
          deep: "#1e4f5a",
        },
        palm: {
          DEFAULT: "#3f6b55",
          soft: "#e8f0eb",
        },
        charcoal: "#2a2a28",
        muted: "#6b6a66",
        line: "#e6e0d6",
        coral: {
          DEFAULT: "#c45c3e",
          deep: "#9a3f28",
          soft: "#f7e8e2",
        },
        amber: "#c48a2e",
        admin: {
          DEFAULT: "#7c3aed",
          deep: "#5b21b6",
          soft: "#f3e8ff",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        soft: "1rem",
        quieter: "0.75rem",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
