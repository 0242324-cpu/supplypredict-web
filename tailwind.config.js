export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand:    { DEFAULT: '#0F172A', light: '#1E293B' },
        critical: '#EF4444',
        urgent:   '#F97316',
        normal:   '#22C55E',
        accent:   '#3B82F6',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
