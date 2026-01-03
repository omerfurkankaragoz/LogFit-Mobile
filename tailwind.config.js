/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['System'],
      },
      colors: {
        // iOS Dark Mode Renkleri
        'system-background': '#000000',
        'system-background-secondary': '#1C1C1E',
        'system-background-tertiary': '#2C2C2E',

        // RGBA colors converted for Tailwind
        'system-label': 'rgba(255, 255, 255, 0.95)',
        'system-label-secondary': 'rgba(235, 235, 245, 0.6)',
        'system-label-tertiary': 'rgba(235, 235, 245, 0.3)',
        'system-label-quaternary': 'rgba(235, 235, 245, 0.18)',

        'system-fill': 'rgba(120, 120, 128, 0.36)',
        'system-fill-secondary': 'rgba(120, 120, 128, 0.24)',
        'system-fill-tertiary': 'rgba(120, 120, 128, 0.18)',

        'system-separator': 'rgba(84, 84, 88, 0.6)',

        // Vurgu Renkleri
        'system-blue': '#0A84FF',
        'system-green': '#30D158',
        'system-red': '#FF453A',
        'system-yellow': '#FFD60A',
        'system-orange': '#FF9F0A',
      }
    },
  },
  plugins: [],
}