/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#070c18',
          darker: '#04070f',
          surface: '#0f172a',
          card: '#131e36',
          'card-light': '#ffffff',
          navy: '#0b1329',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-light': 'rgba(0, 0, 0, 0.08)',
          cyan: '#00f0ff',
          'cyan-muted': '#06b6d4',
          blue: '#3b82f6',
          electric: '#0ea5e9',
          pista: '#10b981',
          'pista-light': '#6ee7b7',
          'pista-subtle': '#ecfdf5',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyber-gradient': 'linear-gradient(135deg, rgba(0, 240, 255, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)',
      },
      boxShadow: {
        'subtle-glow': '0 0 25px -5px rgba(0, 240, 255, 0.15)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
        'card-light': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}

