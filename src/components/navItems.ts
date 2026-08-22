/*
 * Shared nav data for the desktop sidebar, the mobile bottom bar and the mobile
 * sheet. The two shells render the same destinations at different breakpoints,
 * so the lists live here rather than in either component.
 */

export interface NavItem {
  /** Material Symbols glyph name, rendered as `<span className="material-symbols-outlined">`. */
  icon: string;
  label: string;
  to: string;
}

/** Primary destinations — the sidebar's main nav and the mobile bottom bar. */
export const primaryNavItems: NavItem[] = [
  { icon: 'group', label: 'My Groups', to: '/' },
  { icon: 'explore', label: 'Discover', to: '/discover' },
  { icon: 'person', label: 'Profile', to: '/profile' },
];

/** Secondary destinations — the sidebar's bottom cluster and the mobile sheet. */
export const secondaryNavItems: NavItem[] = [
  { icon: 'settings', label: 'Settings', to: '/settings' },
  { icon: 'help', label: 'Help', to: '/help' },
];

/**
 * Fills the Material Symbols glyph for an active destination. The font ships as
 * a variable font (see the `@import` in `src/index.css`), so the filled variant
 * is an axis setting rather than a separate glyph name.
 */
export const ACTIVE_ICON_STYLE = {
  fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
} as const;
