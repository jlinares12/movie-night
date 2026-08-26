import plugin from 'tailwindcss/plugin'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* surface tier */
        'surface':                      'rgb(var(--color-surface) / <alpha-value>)',
        'surface-dim':                  'rgb(var(--color-surface-dim) / <alpha-value>)',
        'surface-bright':               'rgb(var(--color-surface-bright) / <alpha-value>)',
        'surface-container-lowest':     'rgb(var(--color-surface-container-lowest) / <alpha-value>)',
        'surface-container-low':        'rgb(var(--color-surface-container-low) / <alpha-value>)',
        'surface-container':            'rgb(var(--color-surface-container) / <alpha-value>)',
        'surface-container-high':       'rgb(var(--color-surface-container-high) / <alpha-value>)',
        'surface-container-highest':    'rgb(var(--color-surface-container-highest) / <alpha-value>)',
        'on-surface':                   'rgb(var(--color-on-surface) / <alpha-value>)',
        'on-surface-variant':           'rgb(var(--color-on-surface-variant) / <alpha-value>)',
        'inverse-surface':              'rgb(var(--color-inverse-surface) / <alpha-value>)',
        'inverse-on-surface':           'rgb(var(--color-inverse-on-surface) / <alpha-value>)',
        'outline':                      'rgb(var(--color-outline) / <alpha-value>)',
        'outline-variant':              'rgb(var(--color-outline-variant) / <alpha-value>)',
        'surface-tint':                 'rgb(var(--color-surface-tint) / <alpha-value>)',
        'surface-variant':              'rgb(var(--color-surface-variant) / <alpha-value>)',
        /* primary */
        'primary':                      'rgb(var(--color-primary) / <alpha-value>)',
        'on-primary':                   'rgb(var(--color-on-primary) / <alpha-value>)',
        'primary-container':            'rgb(var(--color-primary-container) / <alpha-value>)',
        'on-primary-container':         'rgb(var(--color-on-primary-container) / <alpha-value>)',
        'inverse-primary':              'rgb(var(--color-inverse-primary) / <alpha-value>)',
        'primary-fixed':                'rgb(var(--color-primary-fixed) / <alpha-value>)',
        'primary-fixed-dim':            'rgb(var(--color-primary-fixed-dim) / <alpha-value>)',
        'on-primary-fixed':             'rgb(var(--color-on-primary-fixed) / <alpha-value>)',
        'on-primary-fixed-variant':     'rgb(var(--color-on-primary-fixed-variant) / <alpha-value>)',
        /* secondary */
        'secondary':                    'rgb(var(--color-secondary) / <alpha-value>)',
        'on-secondary':                 'rgb(var(--color-on-secondary) / <alpha-value>)',
        'secondary-container':          'rgb(var(--color-secondary-container) / <alpha-value>)',
        'on-secondary-container':       'rgb(var(--color-on-secondary-container) / <alpha-value>)',
        'secondary-fixed':              'rgb(var(--color-secondary-fixed) / <alpha-value>)',
        'secondary-fixed-dim':          'rgb(var(--color-secondary-fixed-dim) / <alpha-value>)',
        'on-secondary-fixed':           'rgb(var(--color-on-secondary-fixed) / <alpha-value>)',
        'on-secondary-fixed-variant':   'rgb(var(--color-on-secondary-fixed-variant) / <alpha-value>)',
        /* tertiary */
        'tertiary':                     'rgb(var(--color-tertiary) / <alpha-value>)',
        'on-tertiary':                  'rgb(var(--color-on-tertiary) / <alpha-value>)',
        'tertiary-container':           'rgb(var(--color-tertiary-container) / <alpha-value>)',
        'on-tertiary-container':        'rgb(var(--color-on-tertiary-container) / <alpha-value>)',
        'tertiary-fixed':               'rgb(var(--color-tertiary-fixed) / <alpha-value>)',
        'tertiary-fixed-dim':           'rgb(var(--color-tertiary-fixed-dim) / <alpha-value>)',
        'on-tertiary-fixed':            'rgb(var(--color-on-tertiary-fixed) / <alpha-value>)',
        'on-tertiary-fixed-variant':    'rgb(var(--color-on-tertiary-fixed-variant) / <alpha-value>)',
        /* error */
        'error':                        'rgb(var(--color-error) / <alpha-value>)',
        'on-error':                     'rgb(var(--color-on-error) / <alpha-value>)',
        'error-container':              'rgb(var(--color-error-container) / <alpha-value>)',
        'on-error-container':           'rgb(var(--color-on-error-container) / <alpha-value>)',
        /* background */
        'background':                   'rgb(var(--color-background) / <alpha-value>)',
        'on-background':                'rgb(var(--color-on-background) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      /*
       * Deliberately no `fontSize` here. The type scale lives once, as the `.type-*`
       * classes in `src/index.css` — see the Styling conventions section of CLAUDE.md.
       * A duplicate set of `text-*` tokens used to sit at this spot with byte-identical
       * values, but it set neither font-family nor colour, so `text-headline-sm` on a
       * <p> silently rendered in Inter instead of Montserrat. `src/__tests__/typography
       * .test.ts` fails the build if any of those retired names comes back.
       *
       * Tailwind's own default sizes (`text-xs`, `text-sm`, …) are untouched: `extend`
       * only ever added to them.
       */
      borderRadius: {
        sm:      '0.25rem',
        DEFAULT: '0.5rem',
        md:      '0.75rem',
        lg:      '1rem',
        xl:      '1.5rem',
        full:    '9999px',
      },
      spacing: {
        xs:               '4px',
        sm:               '12px',
        md:               '24px',
        lg:               '48px',
        xl:               '80px',
        gutter:           '16px',
        'margin-mobile':  '20px',
        'margin-desktop': '64px',
      },
      zIndex: {
        sidebar:       '50',
        'loading-bar': '60',
        modal:         '70',
      },
      keyframes: {
        /*
         * Distances are in units of the *swept element's* own width, so the
         * traverse is only edge-to-edge for an element one third as wide as its
         * container (`w-1/3`): -100% parks it just off the left edge, 300% just
         * off the right. A different sliver width needs a different end value.
         */
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(300%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        /*
         * Same keyframe, same `w-1/3` sliver — only slower. A wider sliver would
         * need its own keyframe, since the travel distance lives there, not here.
         */
        'shimmer-slow': 'shimmer 2s ease-in-out infinite',
      },
    },
  },
  plugins: [
    /*
     * Reduced motion is handled once, here, so every shimmer consumer inherits it.
     * Any `animation` entry named `shimmer*` is covered automatically — a new
     * consumer cannot forget to opt in.
     */
    plugin(({ addUtilities, theme }) => {
      const shimmers = Object.keys(theme('animation'))
        .filter((name) => name.startsWith('shimmer'))
        .map((name) => `.animate-${name}`)

      addUtilities({
        '@media (prefers-reduced-motion: reduce)': {
          [shimmers.join(', ')]: { animation: 'none' },
        },
      })
    }),
  ],
}
