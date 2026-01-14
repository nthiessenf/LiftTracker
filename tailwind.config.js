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
        'inter': ['Inter-Regular', 'system-ui'],
        'inter-light': ['Inter-Light', 'system-ui'],
        'inter-medium': ['Inter-Medium', 'system-ui'],
        'inter-semibold': ['Inter-SemiBold', 'system-ui'],
        'inter-bold': ['Inter-Bold', 'system-ui'],
      },
    },
  },
  plugins: [],
}

