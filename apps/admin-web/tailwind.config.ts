import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          800: '#164e63',
          900: '#102f4d',
        },
        primary: {
          DEFAULT: '#0b9f91',
          foreground: '#ffffff',
        },
        petwo: {
          navy: '#102f4d',
          teal: '#0b9f91',
          green: '#12b98f',
        },
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgb(15 23 42 / 0.14)',
      },
    },
  },
  plugins: [],
};

export default config;
