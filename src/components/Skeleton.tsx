import { createContext, useContext, type ReactNode } from "react";
import { useSkeletonRegion } from "../context/LoadingContext";

/**
 * True while a `SkeletonGroup` ancestor owns the sweep. Blocks read this to
 * render flat instead of animating individually — a region of skeletons should
 * read as one object catching light, not as N blocks pulsing out of step.
 */
const SkeletonGroupContext = createContext(false);

type SkeletonVariant = 'text' | 'rect' | 'circle';

const BLOCK = 'bg-surface-container-high';

/*
 * `className` is appended to these, never merged with them, so a variant default and a
 * caller override are two classes of equal specificity — which one wins is decided by
 * their order in the generated stylesheet, and Tailwind emits utilities in lexicographic
 * key order. `rounded-lg` sorts *before* `rounded-md`, so a baked-in `rounded-md` on the
 * rect variant would silently beat a caller asking for `rounded-lg`. Hence: rect owns
 * neither its size nor its shape. Both belong to the caller, e.g. "h-48 rounded-xl".
 */
const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  text:   'h-4 rounded',
  rect:   '',
  circle: 'aspect-square rounded-full', // sized by width, e.g. "w-12"
};

/**
 * The travelling highlight. `w-1/3` is not cosmetic: the shared `shimmer`
 * keyframe translates -100% → 300% in units of this element's own width, so
 * only a third-width sliver makes an edge-to-edge pass.
 *
 * `motion-reduce:hidden` is deliberate belt-and-braces. The Tailwind plugin
 * already sets `animation: none` under reduced motion, but that alone parks the
 * gradient at translateX(0) — a band sitting over the block. Hiding it leaves
 * the flat tint, which is the intended degraded state.
 */
function Sweep() {
  return (
    <span
      aria-hidden="true"
      data-testid="skeleton-sweep"
      className="
        pointer-events-none absolute inset-y-0 left-0 w-1/3
        animate-shimmer-slow motion-reduce:hidden
        bg-gradient-to-r from-transparent via-on-surface/10 to-transparent
      "
    />
  );
}

interface SkeletonProps {
  variant?: SkeletonVariant;
  /** Text variant only — renders N stacked lines, the last one shortened. */
  lines?: number;
  className?: string;
}

export function Skeleton({ variant = 'text', lines = 1, className = '' }: SkeletonProps) {
  const inGroup = useContext(SkeletonGroupContext);

  // A standalone skeleton has no group to sweep it, so it sweeps itself.
  const sweep = inGroup ? '' : 'relative overflow-hidden';

  if (variant === 'text' && lines > 1) {
    return (
      <div
        aria-hidden="true"
        data-testid="skeleton"
        className={`flex flex-col gap-2 ${sweep} ${className}`}
      >
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            data-testid="skeleton-line"
            className={`${BLOCK} ${VARIANT_CLASSES.text} ${i === lines - 1 ? 'w-3/5' : ''}`}
          />
        ))}
        {!inGroup && <Sweep />}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      data-testid="skeleton"
      className={`${BLOCK} ${VARIANT_CLASSES[variant]} ${sweep} ${className}`}
    >
      {!inGroup && <Sweep />}
    </div>
  );
}

interface SkeletonGroupProps {
  /** Announced once for the whole region. */
  label?: string;
  className?: string;
  children: ReactNode;
}

export function SkeletonGroup({
  label = 'Loading…',
  className = '',
  children,
}: SkeletonGroupProps) {
  // This region owns its wait, so the bar must not also run for it. Registering here
  // rather than in each consumer is what makes the rule impossible to forget.
  useSkeletonRegion();

  return (
    <div
      role="status"
      data-testid="skeleton-group"
      className={`relative overflow-hidden ${className}`}
    >
      <SkeletonGroupContext.Provider value={true}>{children}</SkeletonGroupContext.Provider>
      <Sweep />
      <span className="sr-only">{label}</span>
    </div>
  );
}
