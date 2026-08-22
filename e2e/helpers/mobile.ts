import { expect, type Locator, type Page } from '@playwright/test';

/** Sub-pixel slack — layout rounding routinely lands a pixel over. */
const TOLERANCE = 1;

/** Minimum touch target, per WCAG 2.2 SC 2.5.8 / the ticket's 44px rule. */
export const MIN_TOUCH_TARGET = 44;

interface Offender {
  /** Which box actually scrolls — `html`, `body`, or a scroll container's selector. */
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
  /*
   * Measure only once webfonts are settled. Before Material Symbols loads, every
   * `<span class="material-symbols-outlined">menu</span>` paints its literal text
   * instead of the glyph — far wider — which would make this assertion flake on a cold
   * cache rather than report a real layout bug.
   */
  await page.evaluate(() => document.fonts.ready.then(() => undefined));

  const offenders = await page.evaluate(
    ({ tolerance }) => {
      const describe = (el: Element): string => {
        const cls = el.getAttribute('class');
        return cls ? `${el.tagName.toLowerCase()}.${cls.trim().split(/\s+/).join('.')}` : el.tagName.toLowerCase();
      };

      /*
       * A child can hang past its container and still be harmless if an ancestor clips
       * it — `ComingSoon`'s 800px rings live inside an `overflow-hidden` wrapper exactly
       * so they stay circles on a narrow screen. Fixed elements never contribute to
       * scrollable overflow at all.
       */
      const isClipped = (el: Element, stopAt: Element): boolean => {
        for (let node = el.parentElement; node && node !== stopAt.parentElement; node = node.parentElement) {
          const { overflowX } = getComputedStyle(node);
          if (overflowX === 'hidden' || overflowX === 'clip') return true;
        }
        return false;
      };

      const findCulprits = (container: Element): string[] => {
        const limit = container.getBoundingClientRect().right + container.scrollLeft;
        return Array.from(container.querySelectorAll<HTMLElement>('*'))
          .filter((el) => {
            if (getComputedStyle(el).position === 'fixed') return false;
            if (isClipped(el, container)) return false;
            return el.getBoundingClientRect().right + container.scrollLeft > limit + tolerance;
          })
          .map((el) => ({ el, overhang: el.getBoundingClientRect().right - limit }))
          .sort((a, b) => b.overhang - a.overhang)
          .slice(0, 5)
          .map(({ el, overhang }) => `${describe(el)} (+${Math.round(overhang)}px)`);
      };

      // The document, plus anything that has become a horizontal scroll container.
      const containers = new Set<Element>([document.documentElement, document.body]);
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
        const { overflowX } = getComputedStyle(el);
        if (overflowX === 'auto' || overflowX === 'scroll') containers.add(el);
      }

      const found: {
        container: string;
        scrollWidth: number;
        clientWidth: number;
        culprits: string[];
      }[] = [];

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
    },
    { tolerance: TOLERANCE },
  );

  const assert = soft ? expect.soft : expect;
  assert(offenders as Offender[], `horizontal overflow at ${label}`).toEqual([]);
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
  const reachable = await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    // True when the hit node is the element itself or a descendant — tapping a button
    // lands on the icon `<span>` inside it, which still counts.
    return !!hit && el.contains(hit);
  });
  expect(reachable, `${label} is covered by another element`).toBe(true);
}

/**
 * Assert a control clears the 44x44 minimum touch target.
 *
 * Reports both dimensions on failure rather than short-circuiting on width, so a 28x28
 * button tells you it is wrong on both axes in one run.
 */
export async function expectMinTouchTarget(locator: Locator, label: string): Promise<void> {
  const box = await locator.boundingBox();
  expect(box, `${label} has no layout box`).not.toBeNull();
  const { width, height } = box!;
  expect(
    { tooNarrow: width < MIN_TOUCH_TARGET, tooShort: height < MIN_TOUCH_TARGET },
    `${label} is ${Math.round(width)}x${Math.round(height)}, below the ${MIN_TOUCH_TARGET}px minimum touch target`,
  ).toEqual({ tooNarrow: false, tooShort: false });
}
