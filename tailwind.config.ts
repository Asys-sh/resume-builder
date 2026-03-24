import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#d4a373', // Earthy Tan
        'secondary-accent': '#ccd5ae', // Muted Green
        cream: '#fefae0',
        beige: '#e9edc9',
        yellow: '#faedcd',
        dark: '#333333',
        light: '#fefae0',
        // Canonical design system color names
        'background-light': '#fefae0',
        'background-dark': '#211911',
        'secondary-bg': '#e9edc9',
        'border-color': '#ccd5ae',
        highlight: '#faedcd',
        'text-main': '#3a3226',
        'text-subtle': '#6f6454',
      },
      fontFamily: {
        display: ['var(--font-space)', 'Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
      height: {
        screen: '100vh',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
