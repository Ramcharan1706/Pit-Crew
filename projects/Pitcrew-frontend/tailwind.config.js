/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        "primary-dark": "#1e40af",
        "primary-light": "#3b82f6",
        danger: "#dc2626",
        success: "#10b981",
        warning: "#f59e0b",
        background: "#0f172a",
        surface: "#1e293b",
        "surface-hover": "#334155",
      },
    },
  },
  plugins: [],
}
