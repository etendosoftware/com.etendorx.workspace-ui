/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          100: 'var(--primary-100)',
          500: 'var(--primary-500)',
        },
        // Secondary colors
        secondary: {
          100: 'var(--secondary-100)',
          300: 'var(--secondary-300)',
          500: 'var(--secondary-500)',
        },
        // Tertiary colors
        tertiary: {
          50: 'var(--tertiary-50)',
          100: 'var(--tertiary-100)',
          900: 'var(--tertiary-900)',
        },
        // Neutral colors
        'neutral-custom': {
          50: 'var(--neutral-50)',
          300: 'var(--neutral-300)',
          1000: 'var(--neutral-1000)',
        },
        // Background
        background: 'var(--background)',
        // Dynamic colors
        dynamic: {
          main: 'var(--dynamic-main)',
          dark: 'var(--dynamic-dark)',
          light: 'var(--dynamic-light)',
          'contrast-text': 'var(--dynamic-contrast-text)',
        },
        // Baseline neutral colors
        baseline: {
          0: 'var(--baseline-neutral-0)',
          10: 'var(--baseline-neutral-10)',
          20: 'var(--baseline-neutral-20)',
          30: 'var(--baseline-neutral-30)',
          40: 'var(--baseline-neutral-40)',
          50: 'var(--baseline-neutral-50)',
          60: 'var(--baseline-neutral-60)',
          70: 'var(--baseline-neutral-70)',
          80: 'var(--baseline-neutral-80)',
          90: 'var(--baseline-neutral-90)',
          100: 'var(--baseline-neutral-100)',
        },
        // Transparent neutrals
        'transparent-neutral': {
          0: 'var(--transparent-neutral-0)',
          5: 'var(--transparent-neutral-5)',
          10: 'var(--transparent-neutral-10)',
          20: 'var(--transparent-neutral-20)',
          30: 'var(--transparent-neutral-30)',
          40: 'var(--transparent-neutral-40)',
          50: 'var(--transparent-neutral-50)',
          60: 'var(--transparent-neutral-60)',
          70: 'var(--transparent-neutral-70)',
          80: 'var(--transparent-neutral-80)',
        },
        // Etendo primary
        etendo: {
          main: 'var(--etendo-primary-main)',
          dark: 'var(--etendo-primary-dark)',
          'contrast-text': 'var(--etendo-primary-contrast-text)',
          light: 'var(--etendo-primary-light)',
        },
        // Specific colors
        success: {
          main: 'var(--success-main)',
          light: 'var(--success-light)',
          'contrast-text': 'var(--success-contrast-text)',
        },
        warning: {
          main: 'var(--warning-main)',
          light: 'var(--warning-light)',
          'contrast-text': 'var(--warning-contrast-text)',
        },
        error: {
          main: 'var(--error-main)',
          light: 'var(--error-light)',
          'contrast-text': 'var(--error-contrast-text)',
        },
        draft: {
          main: 'var(--draft-main)',
          'contrast-text': 'var(--draft-contrast-text)',
        },
      },
    },
  },
  plugins: [],
};
