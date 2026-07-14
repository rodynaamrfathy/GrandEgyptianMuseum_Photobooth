/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'Arial', 'Helvetica', 'sans-serif'],
        mariam: ['Mariam', 'serif'],
        averia: ['Averia Libre', 'sans-serif'],
        'greta-arabic': ['Greta Arabic', 'Cairo', 'Arial', 'Helvetica', 'sans-serif'],
        'greta-sans': ['Greta Sans', 'Arial', 'Helvetica', 'sans-serif'],
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
