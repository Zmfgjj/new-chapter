/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        coffee: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        cream: '#f8fafc', // slate-50
        bark: '#d4af37', // Gold accent
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        steamRise: {
          '0%': { opacity: '0.6', transform: 'translateY(0) scaleX(1)' },
          '50%': { opacity: '0.3', transform: 'translateY(-12px) scaleX(1.3)' },
          '100%': { opacity: '0', transform: 'translateY(-24px) scaleX(0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'steam': 'steamRise 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
      }
    },
  },
  plugins: [],
}
