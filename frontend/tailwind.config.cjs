/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/react/dist/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: '#07090f',
        foreground: '#f1f5f9',
        primary: {
          DEFAULT: '#22c55e',
          foreground: '#07090f',
          50:  '#052e16',
          100: '#064e1f',
          200: '#0a6627',
          300: '#16803d',
          400: '#22c55e',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        secondary: {
          DEFAULT: '#3b82f6',
          foreground: '#f1f5f9',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
        default: {
          100: '#0d1117',
          200: '#161b25',
          300: '#1e2535',
          400: '#252d3d',
          500: '#374151',
          600: '#64748b',
          700: '#94a3b8',
        },
        success:  { DEFAULT: '#22c55e', foreground: '#07090f' },
        warning:  { DEFAULT: '#f59e0b', foreground: '#07090f' },
        danger:   { DEFAULT: '#ef4444', foreground: '#f1f5f9' },
        focus:    '#22c55e',
      },
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: []
}
