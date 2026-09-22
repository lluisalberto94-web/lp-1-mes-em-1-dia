import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#070707', panel: '#0d0d0d', cream: '#f1eadc', gold: '#d6ad4f', gold2: '#f2d179', muted: '#aba79e'
      },
      boxShadow: { glow: '0 18px 60px rgba(214,173,79,.10)' }
    }
  },
  plugins: []
};
export default config;
