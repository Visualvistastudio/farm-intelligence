/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#1B4332',
          950: '#081C15',
        },
        earth: {
          50: '#FAF8F5',
          100: '#F5EFE6',
          200: '#E6D7C3',
          300: '#D4BA9F',
          400: '#B89371',
          500: '#9C7249',
          600: '#7E5733',
          700: '#634225',
          800: '#4D321D',
          900: '#3D2616',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        }
      },
    },
  },
  plugins: [],
}
