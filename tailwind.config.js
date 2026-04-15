/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/src/**/*.{js,ts,jsx,tsx}',
    './src/renderer/index.html'
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: '#F5F0E8',
          dark: '#E8E0D1',
          deep: '#D8CCBA'
        },
        moss: {
          DEFAULT: '#4A7C59',
          dark: '#355C41',
          light: '#6A9C79'
        },
        sage: {
          DEFAULT: '#8FAF8F',
          light: '#B8CBB8'
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#DFC078'
        },
        berry: '#D46A6A',
        ink: {
          DEFAULT: '#2C2C2C',
          light: '#5A5A5A'
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Nunito', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '24px',
        pill: '999px'
      },
      boxShadow: {
        float: '0 12px 32px rgba(44,44,44,0.12), 0 4px 8px rgba(44,44,44,0.05)',
        'float-sm': '0 6px 16px rgba(44,44,44,0.10), 0 2px 4px rgba(44,44,44,0.05)',
        button: '0 4px 0 #355C41, 0 8px 12px rgba(74,124,89,0.3)',
        'button-pressed': '0 0 0 #355C41',
        inset: 'inset 0 2px 0 rgba(255,255,255,0.6), inset 0 -2px 0 rgba(0,0,0,0.04)',
        'inset-sm': 'inset 0 1px 0 rgba(255,255,255,0.5)'
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(#E8E0D1 1px, transparent 1px)',
        'dot-grid-sm': 'radial-gradient(#D8CCBA 1px, transparent 1px)'
      },
      backgroundSize: {
        'dot-12': '12px 12px',
        'dot-16': '16px 16px'
      },
      animation: {
        'spring-up': 'springUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) backwards',
        'spring-up-slow': 'springUp 1s cubic-bezier(0.34, 1.56, 0.64, 1) backwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite'
      },
      keyframes: {
        springUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        }
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }
    }
  },
  plugins: []
}
