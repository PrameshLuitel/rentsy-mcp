/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#D42B65", 400: "#EE4E86", 600: "#AA2251", 300: "#E580A3", 200: "#EEAAC1", 100: "#F6D5E0", 50: "#FBEAF0" },
        neutral: { 900: "#101B30", 800: "#283245", 700: "#404959", 400: "#9FA4AC", 300: "#CFD1D6", 200: "#E7E8EA", 100: "#EFF0F2", 50: "#F4F5F7", 25: "#F9F9F9" },
        success: { 500: "#3CD984", 600: "#30AE6A", 50: "#ECFBF3" },
        canvas: "#FFFFFF",
        ink: "#101B30",
        body: "#404959",
        muted: "#707683",
        hairline: "#E7E8EA",
      },
      fontFamily: {
        brand: ['"Inter"', '-apple-system', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        full: "9999px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.08)",
        cardHover: "0 4px 16px rgba(0,0,0,0.12)",
        btn: "0 6px 18px rgba(212,43,101,0.35)",
      },
      fontSize: {
        "body-md": ["16px", "1.5"],
        "body-sm": ["14px", "1.43"],
        "body-xs": ["12px", "1.33"],
        "caption": ["13px", "1.23"],
        "caption-md": ["12px", "1.25"],
        "subtitle-xs": ["13px", "1.23"],
      },
      spacing: {
        section: "64px",
      },
    },
  },
  plugins: [],
}
