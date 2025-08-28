/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#856292',
        'primary-hover': '#8E76A1',
        'primary-press': '#988BB0',
        'primary-disabled': '#6F48694D',
        secondary: '#FF617F',
        'secondary-hover': '#FF849B',
        'secondary-press': '#FF9EB1',
        'secondary-disabled': '#FF617F4D',
        'text-primary': '#514062',
        'base-light': '#FBE2CA',
        'base-dark': '#332D2D',

        // トースト用のより鮮明な色定義
        'toast-info': '#007BFF',
        'toast-info-hover': '#0056B3',
        'toast-error': '#DC3545',
        'toast-error-hover': '#BD2130',
        'toast-success': '#28A745',
        'toast-success-hover': '#218838',
        'toast-tool': '#9C27B0',
        'toast-tool-hover': '#7B1FA2',
      },
      fontFamily: {
        M_PLUS_2: ['Montserrat', 'M_PLUS_2', 'sans-serif'],
        Montserrat: ['Montserrat', 'sans-serif'],
      },
      zIndex: {
        5: '5',
        15: '15',
      },
      width: {
        'col-span-2': '184px',
        'col-span-4': '392px',
        'col-span-7': '704px',
      },
      keyframes: {
        'fly-to-gallery': {
          '0%': {
            transform: 'scale(1) translateX(0px) translateY(0px)',
            opacity: '1',
          },
          '50%': {
            transform: 'scale(0.5) translateX(300px) translateY(-300px)',
            opacity: '0.5',
          },
          '100%': {
            transform: 'scale(0.1) translateX(600px) translateY(-600px)',
            opacity: '0',
          },
        },
      },
      animation: {
        'fly-to-gallery':
          'fly-to-gallery 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
      },
    },
  },
  plugins: [],
}
