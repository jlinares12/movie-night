interface Props {
  /** Material Symbols glyph shown in the medallion. */
  icon: string;
  /** Headline — the promise of the page, not its nav label. */
  title: string;
  /** A sentence or two on what the page will actually do once it ships. */
  description: string;
  /** Caption to the left of the progress bar, e.g. "Rendering profile". */
  progressLabel: string;
  /** How far along the feature is, 0–100. Drives the bar and the printed %. */
  progress: number;
  /** Small pill pinned to the medallion. */
  badge?: string;
}

/**
 * Placeholder for a navigation destination that doesn't exist yet, so the
 * sidebar has somewhere real to point. Drops into `MainLayout`'s content area,
 * whose vertical padding is what the `min-h` calc below subtracts: `py-lg` on
 * both sides at `lg` and up (`6rem`), and on mobile the taller `py-lg pb-32`
 * plus the sticky `MobileTopBar` (`15rem`).
 */
export default function ComingSoon({
  icon,
  title,
  description,
  progressLabel,
  progress,
  badge = 'Beta',
}: Props) {
  const pct = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <section className="relative flex min-h-[calc(100vh-15rem)] lg:min-h-[calc(100vh-6rem)] items-center justify-center">
      {/*
       * Ambient layers: drifting grid, scanline sweep, concentric rings.
       *
       * The negative insets cancel `MainLayout`'s horizontal gutter and `py-lg`
       * so the backdrop bleeds to the edge of the content area instead of
       * stopping at the page gutter — they must stay in step with that padding,
       * including its breakpoint (`margin-mobile` below `lg`, `margin-desktop`
       * above). Bleeding by exactly the padding lands flush with main's padding
       * box, so it adds no scrollable overflow; overstating it would. The `-y`
       * inset deliberately understates mobile's `pb-32`, which is safe —
       * under-bleeding just stops short, it cannot introduce scroll.
       *
       * The clipping `overflow-hidden` lives here rather than on the section,
       * which would otherwise crop this element back to the gutter.
       */}
      <div
        aria-hidden="true"
        className="coming-soon-backdrop pointer-events-none absolute -inset-x-margin-mobile lg:-inset-x-margin-desktop -inset-y-lg overflow-hidden"
      >
        <div className="coming-soon-grid absolute inset-0" />
        <div className="coming-soon-scanline absolute inset-x-0 top-0 h-1/4" />
        {/* Fixed pixel sizes on purpose — the wrapper's `overflow-hidden` crops
            them on narrow viewports, which keeps them circles rather than
            letting a viewport-relative cap flatten them into ellipses. */}
        <div className="absolute inset-0 flex items-center justify-center mix-blend-screen">
          <div className="coming-soon-ring h-[800px] w-[800px] shrink-0 rounded-full border border-primary-container" />
          <div className="coming-soon-ring absolute h-[600px] w-[600px] rounded-full border border-primary-container [animation-delay:-2s]" />
          <div className="absolute h-[400px] w-[400px] rounded-full border-2 border-primary opacity-10 blur-xl" />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="cinematic-glow relative mb-8 flex h-24 w-24 items-center justify-center rounded-full border-2 border-surface-variant bg-surface-container-high">
          <span
            className="material-symbols-outlined text-on-surface-variant opacity-50"
            style={{ fontSize: '48px' }}
          >
            {icon}
          </span>
          {badge && (
            <span className="text-neon-glow absolute -bottom-2 -right-2 rounded-full border border-primary bg-surface px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              {badge}
            </span>
          )}
        </div>

        <span className="animate-pulse-border-glow type-label-sm mb-6 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 uppercase tracking-widest text-primary">
          Coming Soon
        </span>

        <h2 className="type-display-lg-mobile md:type-display-lg animate-pulse-glow mb-6">{title}</h2>

        <p className="type-body-lg mb-12 max-w-md text-on-surface-variant">{description}</p>

        {/* Decorative-but-honest progress: how far along the feature actually is */}
        <div className="w-full max-w-xs">
          <div className="type-label-sm mb-2 flex justify-between">
            <span>{progressLabel}</span>
            <span className="font-bold text-primary">{pct}%</span>
          </div>
          <div
            role="progressbar"
            aria-label={progressLabel}
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant"
          >
            <div
              className="h-full rounded-full bg-primary shadow-[0_0_10px_rgb(var(--color-primary)/0.8)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
