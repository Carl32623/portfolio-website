/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./blog/**/*.html",
    "./**/*.js" // include script.js
  ],
  theme: { extend: {} },
  plugins: [require("@tailwindcss/typography")],
};

