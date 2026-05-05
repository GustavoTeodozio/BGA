/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'outer-sans': ['MADE Outer Sans', 'Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        brand: {
          wine: {
            50: '#faf5f5',
            100: '#f5ebeb',
            200: '#e8d1d1',
            300: '#d9a8a8',
            400: '#c67f7f',
            500: '#a91919',
            600: '#9d1515',
            700: '#8c1212',
            800: '#710505',
            900: '#5a0404',
            950: '#3d0303',
          },
          gold: {
            50: '#fffbf0',
            100: '#fff7e0',
            200: '#ffead0',
            300: '#ffe4b8',
            400: '#ffd999',
            500: '#F5B932',
            600: '#eab02a',
            700: '#d89f22',
            800: '#b8831a',
            900: '#8a6213',
          },
          dark: {
            900: '#1a1a1a',
            800: '#2d2d2d',
            700: '#525252',
          },
        },
        wine: {
          50: '#faf5f5',
          100: '#f5ebeb',
          200: '#e8d1d1',
          300: '#d9a8a8',
          400: '#c67f7f',
          500: '#a91919',
          600: '#9d1515',
          700: '#8c1212',
          800: '#710505',
          900: '#5a0404',
        },
        gold: {
          50: '#fffbf0',
          100: '#fff7e0',
          200: '#ffead0',
          300: '#ffe4b8',
          400: '#ffd999',
          500: '#F5B932',
          600: '#eab02a',
          700: '#d89f22',
          800: '#b8831a',
          900: '#8a6213',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #710505 0%, #a91919 50%, #F5B932 100%)',
        'gradient-wine': 'linear-gradient(135deg, #710505 0%, #a91919 100%)',
        'gradient-gold': 'linear-gradient(135deg, #F5B932 0%, #ffd999 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}

