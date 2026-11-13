/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '380px',
      },
      colors: {
        brand: {
          dark: '#07090e',
          card: '#0f1420',
          hover: '#141b2c',
          border: '#1c2438',
          accent: '#00e676',
          cyan: '#38bdf8',
          amber: '#f59e0b',
          rose: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

