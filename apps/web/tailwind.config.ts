import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const token = (name: string) => `rgb(var(--color-${name}-rgb) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    container: {
      center: true,
      padding: { DEFAULT: '1rem', md: '1.5rem', lg: '2rem' },
      screens: { xl: '1280px' },
    },
    extend: {
      colors: {
        primary: { DEFAULT: token('primary'), foreground: token('on-primary') },
        accent: { DEFAULT: token('accent'), foreground: token('on-accent') },
        cta: { DEFAULT: token('cta'), hover: token('cta-hover'), foreground: '#FFFFFF' },
        bg: token('bg'),
        surface: token('surface'),
        text: { DEFAULT: token('text'), muted: token('text-muted') },
        border: token('border'),
        success: token('success'),
        danger: token('danger'),
        // alias shadcn/ui
        background: token('bg'),
        foreground: token('text'),
        muted: { DEFAULT: token('muted'), foreground: token('text-muted') },
        card: { DEFAULT: token('surface'), foreground: token('text') },
        popover: { DEFAULT: token('surface'), foreground: token('text') },
        destructive: { DEFAULT: token('danger'), foreground: '#FFFFFF' },
        input: token('border'),
        ring: token('ring'),
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'var(--font-arabic)', 'system-ui', 'sans-serif'],
      },
      spacing: { 18: '4.5rem' },
      maxWidth: { content: '1280px' },
      borderRadius: { lg: '0.75rem', md: '0.5rem', sm: '0.375rem' },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
};

export default config;
