/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1B3A6B',
        royal: '#2255A4',
        primary: '#3B82F6',
        sky: '#60A5FA',
        mist: '#DBEAFE',
        ice: '#EFF6FF',
        ink: '#0F172A',
        'slate-dark': '#1E293B',
        slate: '#334155',
        muted: '#64748B',
        border: '#E2E8F0',
        surface: '#F8FAFC',
        white: '#FFFFFF',
        violet: '#7C3AED',
        indigo: '#6366F1',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        cyan: '#06B6D4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
