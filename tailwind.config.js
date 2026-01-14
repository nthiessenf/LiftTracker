/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      spacing: {
        'card': '20px',
        'section': '32px',
        'screen': '24px',
        'element': '16px',
      },
      fontFamily: {
        'sans': ['Inter_400Regular'],
        'medium': ['Inter_500Medium'],
        'semibold': ['Inter_600SemiBold'],
        'bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
}

