/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#ff8a65',
          400: '#ff7043',
          500: '#ff5722', // Primary Accent Orange (#FF5722)
          600: '#e64a19',
          700: '#d84315',
          800: '#bf360c',
          900: '#7c2d12',
        },
        nearblack: {
          DEFAULT: '#141414',
          50: '#262626',
          100: '#1f1f1f',
          800: '#171717',
          900: '#141414',
        },
        warmbg: '#FAF7F2',       // Warm Notion-like Off-White
        warmcard: '#FFFFFF',     // Clean Card Background
        warmborder: '#E8E2D9',   // Warm Subtle Card Border
        sage: {
          50: '#f0f7f4',
          100: '#d8f3dc',        // Light Sage Green
          500: '#52b788',
          600: '#2d6a4f',        // Soft Sage Green (Open Now / Success)
          700: '#1b4332',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        }
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'warm-accent': '0 10px 30px -5px rgba(255, 87, 34, 0.18), 0 4px 12px -2px rgba(20, 20, 20, 0.04)',
        'card-hover': '0 20px 40px -10px rgba(255, 87, 34, 0.22), 0 8px 20px -4px rgba(20, 20, 20, 0.08)',
        'soft-layered': '0 12px 32px -4px rgba(20, 20, 20, 0.06), 0 4px 12px -2px rgba(20, 20, 20, 0.03)',
        'sage-glow': '0 10px 25px -5px rgba(45, 106, 79, 0.25)',
      },
      scale: {
        102: '1.02',
      },
      borderRadius: {
        'card': '18px',
        'btn': '12px',
      }
    },
  },
  plugins: [],
}
