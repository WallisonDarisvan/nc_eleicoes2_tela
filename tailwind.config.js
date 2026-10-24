/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: '#E8EEF5',
          panel: '#FFFFFF',
          slate: '#F4F7F9',
          border: '#B5C7D9',
          textDark: '#152A57',
          textMuted: '#4B6282',
          navy: '#152A57',
          navyDark: '#0B1733',
          navyLight: '#1E3A6D',
          accent: '#1D4ED8',
          gold: '#D97706',
          green: '#059669',
          greenDark: '#047857',
          red: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'studio-card': '0 4px 20px -2px rgba(15, 37, 50, 0.08), 0 2px 6px -1px rgba(15, 37, 50, 0.04)',
        'studio-glow': '0 0 25px rgba(26, 58, 75, 0.25)',
        'studio-gold': '0 0 25px rgba(217, 119, 6, 0.35)',
        'studio-elevated': '0 10px 30px -5px rgba(15, 37, 50, 0.12)',
      }
    },
  },
  plugins: [],
}
