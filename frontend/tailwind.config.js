/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f8f9fa",
        surface: "#ffffff",
        card: "#ffffff",
        border: "#e8eaed",
        primary: "#ff6b9d",
        secondary: "#ff8e53",
      },
    },
  },
  plugins: [],
}
