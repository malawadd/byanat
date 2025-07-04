import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'orbitron': ['var(--font-orbitron)', 'monospace'],
        'jetbrains': ['var(--font-jetbrains-mono)', 'monospace'],
      },
      colors: {
        'neon-green': '#00ff41',
        'neon-cyan': '#00ffff',
        'neon-magenta': '#ff0080',
        'neon-yellow': '#ffff00',
        'neon-blue': '#0080ff',
      },
      animation: {
        'scan-line': 'scan-line 3s linear infinite',
        'glitch': 'glitch 0.3s infinite',
        'pulse-neon': 'pulse-neon 2s infinite',
        'chromatic-aberration': 'chromatic-aberration 3s ease-in-out infinite',
        'hologram-rotate': 'hologram-rotate 4s linear infinite',
        'screen-glare': 'screen-glare 3s ease-in-out infinite',
      },
      keyframes: {
        'scan-line': {
          '0%': { transform: 'translateY(-100vh)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'glitch': {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        'pulse-neon': {
          '0%, 100%': { 
            boxShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
          },
          '50%': { 
            boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
          },
        },
        'chromatic-aberration': {
          '0%': { filter: 'hue-rotate(0deg)' },
          '25%': { filter: 'hue-rotate(90deg)' },
          '50%': { filter: 'hue-rotate(180deg)' },
          '75%': { filter: 'hue-rotate(270deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
        'hologram-rotate': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' },
        },
        'screen-glare': {
          '0%, 100%': { transform: 'translateX(-100%) translateY(-100%) rotate(45deg)' },
          '50%': { transform: 'translateX(100%) translateY(100%) rotate(45deg)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;