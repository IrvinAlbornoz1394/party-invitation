/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ffc0cb",
        secondary: "#ff69b4",
        bg: "#fff5f7",
        text: "#4a4a4a",
        accent: "#ff85a2",
        ivory: "#fffff0",
        gold: "#d4af37",
      },
    },
  },
  plugins: [],
}
