/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        'greta-sans': ['Greta Sans', 'Arial', 'Helvetica', 'sans-serif'],
        'greta-arabic': ['Greta Arabic', 'Arial', 'Helvetica', 'sans-serif'],
        'mariam': ['Mariam', 'serif'],
      },
      keyframes: {
        bounceSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "bounce-slow": "bounceSlow 2s infinite",
      },
    },
  },
  plugins: [],
};