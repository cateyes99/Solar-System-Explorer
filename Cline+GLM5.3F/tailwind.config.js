/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#030510',
          900: '#060b1a',
          800: '#0b1226',
          700: '#131c3a',
          600: '#1c2a50',
        },
        astro: {
          blue: '#4da6ff',
          cyan: '#67e8f9',
          purple: '#a78bfa',
          orange: '#ff9d45',
          gold: '#ffd27d',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 8px 40px rgba(2, 6, 23, 0.65)',
        glow: '0 0 24px rgba(77, 166, 255, 0.25)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
