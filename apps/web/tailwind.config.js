/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: '#020813', // Deep obsidian maritime void
          900: '#061325', // Sleek navy glass surface
          850: '#0a1d37', // Tactical panel background
          800: '#0f2747', // Elevated card surface
          700: '#163861', // Crisp borders & active elements
          600: '#1e4c85', // Hover borders & interactive frames
          500: '#2b6cb0', // Balanced mid-tone blue
          400: '#38bdf8', // Sky/cyan highlights
          300: '#7dd3fc', // Bright secondary text
          200: '#bae6fd', // Soft cyan-tinted text
          100: '#e0f2fe', // Ice white text
          50: '#f8fafc',  // Pure crisp text
        },
        pulse: {
          cyan: '#00f0ff',     // Hyper-vivid cyber maritime cyan
          teal: '#00e5a3',     // Electric mint
          safe: '#10b981',     // Luminous emerald green
          medium: '#f59e0b',   // Solar amber caution
          high: '#f97316',     // Blazing coral orange
          critical: '#ff1a40', // Laser crimson distress alert
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -2px rgba(0, 240, 255, 0.4)',
        'glow-cyan-sm': '0 0 12px 0 rgba(0, 240, 255, 0.25)',
        'glow-safe': '0 0 25px -2px rgba(16, 185, 129, 0.4)',
        'glow-amber': '0 0 25px -2px rgba(245, 158, 11, 0.4)',
        'glow-critical': '0 0 35px -2px rgba(255, 26, 64, 0.55)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, rgba(6, 19, 37, 0.9) 0%, rgba(10, 29, 55, 0.8) 100%)',
        'radial-ocean': 'radial-gradient(circle at 50% 0%, rgba(0, 240, 255, 0.15) 0%, rgba(2, 8, 19, 0) 70%)',
      }
    },
  },
  plugins: [],
}
