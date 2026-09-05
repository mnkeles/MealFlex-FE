/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Marka ve anlamsal renkler. Koyu tema eklendiğinde aynı anlamlar
        // korunarak yalnız bu tokenların değerleri değiştirilecek.
        primary: {
          50: '#fef3f2',
          100: '#fee4e2',
          200: '#fececa',
          300: '#fcaca5',
          400: '#f87c71',
          500: '#ef5544',
          600: '#dc3626',
          700: '#b92b1c',
          800: '#99271b',
          900: '#7f261d',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        natural: {
          50: '#f4fbf5',
          100: '#ddf3df',
          500: '#3f8f58',
          600: '#2f7044',
          700: '#245836',
        },
        cream: '#fffaf2',
        ink: '#172033',
        canvas: '#f7f8fc',
        surface: '#ffffff',
        border: '#dfe3eb',
        success: {
          50: '#ecfdf3', 100: '#d1fadf', 200: '#a6f4c5', 300: '#6ce9a6', 400: '#32d583',
          500: '#12b76a', 600: '#027a48', 700: '#05603a', 800: '#054f31', 900: '#074d31', 950: '#022c22',
        },
        warning: {
          50: '#fffaeb', 100: '#fef0c7', 200: '#fedf89', 300: '#fec84b', 400: '#fdb022',
          500: '#f79009', 600: '#b54708', 700: '#93370d', 800: '#7a2e0e', 900: '#5f250e', 950: '#451a03',
        },
        danger: {
          50: '#fef3f2', 100: '#fee4e2', 200: '#fecdca', 300: '#fda29b', 400: '#f97066',
          500: '#f04438', 600: '#d92d20', 700: '#b42318', 800: '#912018', 900: '#7a271a', 950: '#55160c',
        },
        info: {
          50: '#eff8ff', 100: '#d1e9ff', 200: '#b2ddff', 300: '#84caff', 400: '#53b1fd',
          500: '#2e90fa', 600: '#1570ef', 700: '#175cd3', 800: '#1849a9', 900: '#194185', 950: '#102a56',
        },
      },
      spacing: {
        'mf-1': '0.25rem',
        'mf-2': '0.5rem',
        'mf-3': '0.75rem',
        'mf-4': '1rem',
        'mf-5': '1.25rem',
        'mf-6': '1.5rem',
        'mf-8': '2rem',
        'mf-10': '2.5rem',
        'mf-12': '3rem',
      },
      borderRadius: {
        'mf-sm': '0.5rem',
        'mf-md': '0.75rem',
        'mf-card': '1rem',
        'mf-surface': '1.25rem',
      },
      fontSize: {
        'mf-display': ['2.25rem', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.025em' }],
        'mf-title': ['1.875rem', { lineHeight: '1.2', fontWeight: '800', letterSpacing: '-0.02em' }],
        'mf-heading': ['1.25rem', { lineHeight: '1.35', fontWeight: '800', letterSpacing: '-0.01em' }],
        'mf-body': ['0.9375rem', { lineHeight: '1.5' }],
        'mf-caption': ['0.8125rem', { lineHeight: '1.45' }],
        'mf-label': ['0.75rem', { lineHeight: '1.35', fontWeight: '700', letterSpacing: '0.02em' }],
      },
      boxShadow: {
        'mf-xs': '0 1px 2px rgba(16, 24, 40, .04)',
        'mf-sm': '0 2px 6px rgba(16, 24, 40, .06)',
        card: '0 1px 2px rgba(16, 24, 40, .04), 0 6px 16px rgba(16, 24, 40, .06)',
        floating: '0 12px 30px rgba(16, 24, 40, .12)',
        'mf-lg': '0 20px 48px rgba(16, 24, 40, .16)',
      },
    },
  },
  plugins: [],
}
