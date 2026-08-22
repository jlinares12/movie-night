import { expect, type Locator, type Page } from '@playwright/test';

/** Sub-pixel slack — layout rounding routinely lands a pixel over. */
const TOLERANCE = 1;

/** Minimum touch target, per WCAG 2.2 SC 2.5.8 / the ticket's 44px rule. */
const MIN_TOUCH_TARGET = 44;

interface Offender {
  /** Which box actually scrolls — `html`, or a scroll container's selector. */
  container: string;
  scrollWidth: number;
  clientWidth: number;
  /** Descendants sticking out past the container's right edge, most-guilty first. */
  culprits: string[];
}

/**
 * Assert nothing scrolls horizontally.
 *
 * Checking `documentElement.scrollWidth` alone is not enough on authenticated routes.
 * `MainLayout`'s `<main>` carries `overflow-y-auto`, and per the CSS overflow spec a
 * `visible` axis computes to `auto` when the other axis is not `visible` — so `<main>`
 * is already a horizontal scroll container. An overflowing child scrolls *it*, and the
 * document's own `scrollWidth` stays exactly `innerWidth`: the naive check passes green
 * on a visibly broken page. So every scroll container is measured, not just the document.
 *
 * On failure the offending descendants are named, because `520 > 375` on its own sends
 * you hunting through a 500-line page for the one fixed width that did it.
 */
export async function expectNoHorizontalOverflow(
  page: Page,
  label: string,
  { soft = false }: { soft?: boolean } = {},
): Promise<void> {
  const offenders = await page.evaluate(async (tolerance): Promise<Offender[]> => {
    /*
     * Measure only once webfonts are settled. Before Material Symbols loads, every
     * `<span class="material-symbols-outlined">menu</span>` paints its literal text
     * instead of the glyph — far wider — which would make this assertion flake on a cold
     * cache rather than report a real layout bug.
     */
    await document.fonts.ready;

    const describe = (el: Element): string => {
      const cls = el.getAttribute('class');
      return cls ? `${el.tagName.toLowerCase()}.${cls.trim().split(/\s+/).join('.')}` : el.tagName.toLowerCase();
    };

    /*
     * A child can hang past its container and still be harmless if an ancestor clips it —
     * `ComingSoon`'s 800px rings live inside an `overflow-hidden` wrapper exactly so they
     * stay circles on a narrow screen. Fixed elements never contribute to scrollable
     * overflow at all.
     */
    const isClipped = (el: Element, stopAt: Element): boolean => {
      for (let node = el.parentElement; node && node !== stopAt; node = node.parentElement) {
        // `MobileMenu` scroll-locks by putting `overflow: hidden` on <body> while the
        // sheet is open. That is a scroll lock, not a layout clip — honouring it would
        // blank out every culprit list on a page measured with the sheet open.
        if (node === document.body) continue;
        const { overflowX } = getComputedStyle(node);
        if (overflowX === 'hidden' || overflowX === 'clip') return true;
      }
      return false;
    };

    const findCulprits = (container: Element): string[] => {
      const limit = container.getBoundingClientRect().right;
      return Array.from(container.querySelectorAll<HTMLElement>('*'))
        // Measure first: `getBoundingClientRect` costs one layout flush for the whole
        // sweep, where `getComputedStyle` is per-element — so only pay it for the few
        // elements that actually hang over.
        .map((el) => ({ el, overhang: el.getBoundingClientRect().right - limit }))
        .filter(
          ({ el, overhang }) =>
            overhang > tolerance && getComputedStyle(el).position !== 'fixed' && !isClipped(el, container),
        )
        .sort((a, b) => b.overhang - a.overhang)
        .slice(0, 5)
        .map(({ el, overhang }) => `${describe(el)} (+${Math.round(overhang)}px)`);
    };

    /*
     * The document, plus anything that has become a horizontal scroll container. <body>
     * is deliberately absent: overflow inside it already surfaces on documentElement, so
     * including it just reports the same bug twice — and if body ever becomes a scroll
     * container in its own right, the sweep below adds it back.
     */
    const containers = new Set<Element>([document.documentElement]);
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
      const { overflowX } = getComputedStyle(el);
      if (overflowX === 'auto' || overflowX === 'scroll') containers.add(el);
    }

    const found: Offender[] = [];
    for (const el of containers) {
      // `documentElement.clientWidth` excludes any classic scrollbar, which is what we
      // want to compare against; `innerWidth` would not.
      if (el.scrollWidth > el.clientWidth + tolerance) {
        found.push({
          container: describe(el),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          culprits: findCulprits(el),
        });
      }
    }
    return found;
  }, TOLERANCE);

  const assert = soft ? expect.soft : expect;
  assert(offenders, `horizontal overflow at ${label}`).toEqual([]);
}

/**
 * Assert an element is actually reachable by a finger — nothing is painted over it.
 *
 * A bounding-box comparison against the bottom bar would miss the real failure mode:
 * `MobileNavBar` is a `glass-panel`, so its backdrop-blur layer can sit on top of a
 * control while still looking transparent. Hit-testing the centre point is what the
 * browser itself does on tap, so it is the assertion that matches the user's experience.
 */
export async function expectTappable(locator: Locator, label: string): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const blocker = await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    // The hit node being a descendant still counts — tapping a button lands on the icon
    // `<span>` inside it.
    if (hit && el.contains(hit)) return null;
    // `elementFromPoint` is viewport-relative and returns null off-screen, which is a
    // different failure from being covered. Say which one it was.
    if (!hit) return 'nothing — its centre point is outside the viewport';
    const cls = hit.getAttribute('class');
    return cls ? `${hit.tagName.toLowerCase()}.${cls.trim().split(/\s+/).join('.')}` : hit.tagName.toLowerCase();
  });
  expect(blocker, `${label} is not tappable — its centre point hits ${blocker}`).toBeNull();
}

/**
 * Assert a control clears the 44x44 minimum touch target.
 *
 * Compares the smaller axis, so either dimension fails it, and carries both in the
 * message — a 28x28 button reports as `28x28`, not just `expected >= 44`.
 */
export async function expectMinTouchTarget(locator: Locator, label: string): Promise<void> {
  const box = await locator.boundingBox();
  expect(box, `${label} has no layout box`).not.toBeNull();
  const { width, height } = box!;
  expect(
    Math.min(width, height),
    `${label} is ${Math.round(width)}x${Math.round(height)}, below the ${MIN_TOUCH_TARGET}px minimum touch target`,
  ).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
}
