/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#ffffff",
        surface: { soft: "#f7f7f7", strong: "#f2f2f2", DEFAULT: "#ffffff" },
        ink: "#222222",
        body: "#3f3f3f",
        muted: { DEFAULT: "#6a6a6a", soft: "#929292" },
        rausch: { DEFAULT: "#ff385c", active: "#e00b41", disabled: "#ffd1da" },
        hairline: { DEFAULT: "#dddddd", soft: "#ebebeb", strong: "#c1c1c1" },
        star: "#222222",
        luxe: "#460479",
        plus: "#92174d",
        error: "#c13515",
        scrim: "rgba(0,0,0,0.5)",
      },
      fontFamily: {
        brand: ['"Inter"', 'Circular', '-apple-system', 'system-ui', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        xl: "32px",
        full: "9999px",
      },
      boxShadow: {
        airbnb: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px",
      },
      spacing: {
        section: "64px",
      },
    },
  },
  plugins: [],
}
