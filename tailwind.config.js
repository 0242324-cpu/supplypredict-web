export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        critical: '#F43F5E',
        urgent:   '#FB923C',
        normal:   '#34D399',
        order:    '#60A5FA',
        accent:   '#3B82F6',
        bg:       '#080C14',
        card:     '#0D1420',
      },
    },
  },
  plugins: [],
}
