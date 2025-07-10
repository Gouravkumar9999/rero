/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scans all source files for Tailwind classes
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: "class", // Enables class-based dark mode
};