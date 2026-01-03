/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      colors: {
        // iOS Dark Mode Renkleri (Düzeltilmiş Format)
        'system-background': '#000000',
        'system-background-secondary': '#1C1C1E',
        'system-background-tertiary': '#2C2C2E',
        
        // RGBA renkleri, Tailwind'in opaklık yönetimi için <alpha-value> ile tanımlandı
        'system-label': 'rgb(255 255 255 / 0.95)',
        'system-label-secondary': 'rgb(235 235 245 / 0.6)',
        'system-label-tertiary': 'rgb(235 235 245 / 0.3)',
        'system-label-quaternary': 'rgb(235 235 245 / 0.18)',

        'system-fill': 'rgb(120 120 128 / 0.36)',
        'system-fill-secondary': 'rgb(120 120 128 / 0.24)',
        'system-fill-tertiary': 'rgb(120 120 128 / 0.18)',
        
        'system-separator': 'rgb(84 84 88 / 0.6)',
        
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