/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          50: '#F0FDFA',   // Lightest mint/teal tint
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',  // Classic Hospital Deep Teal
          800: '#115E59',
          900: '#134E4A',
        },
        clinical: {
          bg: '#F8FAFC',    // Soft hospital off-white
          card: '#FFFFFF',  // Pure crisp medical card
          border: '#E2E8F0',// Subtle clean slate divider
          text: '#0F172A',  // High-contrast readable clinical typography
          muted: '#64748B', // Soft secondary text
          blue: '#0284C7',  // Clinical royal blue
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'hospital': '0 1px 3px 0 rgba(15, 118, 110, 0.05), 0 1px 2px -1px rgba(15, 118, 110, 0.05)',
        'hospital-md': '0 4px 6px -1px rgba(15, 118, 110, 0.07), 0 2px 4px -2px rgba(15, 118, 110, 0.05)',
      }
    },
  },
  plugins: [],
}
