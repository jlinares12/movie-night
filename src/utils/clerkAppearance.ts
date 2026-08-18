import type { ClerkProviderProps } from "@clerk/clerk-react";

type ClerkAppearance = NonNullable<ClerkProviderProps["appearance"]>;

/*
 * Clerk builds its own DOM outside Tailwind's reach, so the Midnight Neon tokens have
 * to be handed over as literal colors: Clerk derives its hover/active/alpha shades by
 * parsing whatever string it is given, and a `rgb(var(--color-primary))` reference is
 * not parseable at that point. Keep these in sync with the `:root` block in
 * `src/index.css` (and `docs/plans/DESIGN.md`, which both are generated from).
 */
const COLOR = {
  background:           '#0a0a0a',
  surface:              '#131313',
  surfaceContainer:     '#201f1f',
  surfaceContainerHigh: '#2a2a2a',
  onSurface:            '#e5e2e1',
  onSurfaceVariant:     '#bacbb9',
  outlineVariant:       '#3b4a3d',
  primary:              '#00e676',  // primary-container — DESIGN.md's action green
  primaryBright:        '#75ff9e',
  onPrimary:            '#003918',
  error:                '#ffb4ab',
} as const;

const DISPLAY_FONT = 'Montserrat, sans-serif';

/* The CSS counterparts live in `src/index.css` as .cinematic-glow / .neon-glow. */
const CINEMATIC_GLOW = '0 0 20px rgba(0, 230, 118, 0.1)';
const NEON_GLOW      = '0 0 15px rgba(0, 230, 118, 0.3)';

/**
 * Global Clerk theme — applied at the provider so `<SignIn>`, `<SignUp>` and
 * `<UserProfile>` all share one palette.
 */
export const clerkAppearance: ClerkAppearance = {
  variables: {
    colorPrimary:           COLOR.primary,
    colorPrimaryForeground: COLOR.onPrimary,
    colorBackground:        COLOR.surfaceContainer,
    colorForeground:        COLOR.onSurface,
    colorMuted:             COLOR.surfaceContainerHigh,
    colorMutedForeground:   COLOR.onSurfaceVariant,
    colorInput:             COLOR.surface,
    colorInputForeground:   COLOR.onSurface,
    colorBorder:            COLOR.outlineVariant,
    /*
     * Clerk mixes this into borders, hover fills and dropdown highlights. On a dark
     * theme it has to be the light end of the scale or every hover state disappears.
     */
    colorNeutral:           'white',
    colorRing:              COLOR.primary,
    colorShadow:            '#000000',
    colorModalBackdrop:     COLOR.background,
    colorDanger:            COLOR.error,
    colorSuccess:           COLOR.primary,
    colorShimmer:           'rgba(0, 230, 118, 0.24)',
    fontFamily:             'Inter, sans-serif',
    fontSize:               '1rem',
    borderRadius:           '0.5rem',
  },
  elements: {
    cardBox: {
      border: `1px solid ${COLOR.outlineVariant}`,
      boxShadow: CINEMATIC_GLOW,
    },
    headerTitle: {
      fontFamily: DISPLAY_FONT,
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    headerSubtitle: {
      color: COLOR.onSurfaceVariant,
    },
    formButtonPrimary: {
      backgroundColor: COLOR.primary,
      color: COLOR.onPrimary,
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'none',
      boxShadow: NEON_GLOW,
      '&:hover': { filter: 'brightness(1.1)' },
      '&:active': { transform: 'scale(0.97)' },
    },
    formFieldInput: {
      backgroundColor: COLOR.surface,
      borderColor: COLOR.outlineVariant,
      '&:focus': {
        borderColor: COLOR.primary,
        boxShadow: '0 0 15px rgba(0, 230, 118, 0.15)',
      },
    },
    formFieldLabel: {
      color: COLOR.onSurfaceVariant,
      fontWeight: 600,
    },
    socialButtonsBlockButton: {
      borderColor: COLOR.outlineVariant,
      color: COLOR.onSurface,
      '&:hover': { borderColor: COLOR.primary },
    },
    dividerLine: {
      backgroundColor: COLOR.outlineVariant,
    },
    dividerText: {
      color: COLOR.onSurfaceVariant,
    },
    footerActionLink: {
      color: COLOR.primaryBright,
      '&:hover': { color: COLOR.primary },
    },
    avatarBox: {
      border: `1px solid ${COLOR.outlineVariant}`,
    },
    badge: {
      backgroundColor: COLOR.surfaceContainerHigh,
      color: COLOR.onSurfaceVariant,
    },
  },
};

/**
 * Overrides layered on top of {@link clerkAppearance} for the `<UserProfile>` embedded
 * in the Settings page. Clerk merges component-level appearance over the provider's,
 * so this only carries the deltas: the widget is a full-width page section here rather
 * than a centered auth card.
 */
export const userProfileAppearance: ClerkAppearance = {
  elements: {
    rootBox: {
      width: '100%',
    },
    cardBox: {
      width: '100%',
      maxWidth: '100%',
      backgroundColor: COLOR.surfaceContainer,
      border: `1px solid ${COLOR.outlineVariant}`,
      borderRadius: '1.5rem',  // rounded-xl, matching the app's content containers
      boxShadow: CINEMATIC_GLOW,
    },
    navbar: {
      /*
       * Clerk paints a brand gradient here by default; flattening it to the low
       * surface tier is what makes the nav column read as part of the app shell.
       */
      background: 'none',
      backgroundColor: COLOR.background,
      borderRight: `1px solid ${COLOR.outlineVariant}`,
    },
    navbarButton: {
      color: COLOR.onSurfaceVariant,
      '&:hover': {
        color: COLOR.primaryBright,
        backgroundColor: COLOR.surfaceContainerHigh,
      },
    },
    navbarButton__active: {
      color: COLOR.primaryBright,
      backgroundColor: COLOR.surfaceContainerHigh,
    },
    navbarMobileMenuButton: {
      color: COLOR.onSurfaceVariant,
    },
    scrollBox: {
      backgroundColor: COLOR.surfaceContainer,
    },
    profileSectionTitleText: {
      fontFamily: DISPLAY_FONT,
      fontWeight: 600,
      color: COLOR.onSurface,
    },
    profileSectionPrimaryButton: {
      color: COLOR.primaryBright,
      '&:hover': { backgroundColor: COLOR.surfaceContainerHigh },
    },
    menuButton: {
      color: COLOR.onSurfaceVariant,
    },
    menuList: {
      backgroundColor: COLOR.surfaceContainerHigh,
      border: `1px solid ${COLOR.outlineVariant}`,
    },
  },
};
