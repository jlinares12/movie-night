import { useCallback, useRef, useState } from "react";
import MobileMenu from "./MobileMenu";

const MENU_ID = "mobile-menu";

/**
 * Mobile-only header. Sticky rather than fixed so it stays in normal flow —
 * `MainLayout`'s `py-lg` then spaces content off it without any offset math.
 */
export default function MobileTopBar() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  /*
   * Mirrors `open` so `close` can stay referentially stable (MobileMenu's
   * route-change effect depends on it) while still knowing whether there was
   * anything to close — without it, the mount-time close would steal focus to
   * the hamburger on every page load.
   */
  const openRef = useRef(false);

  const close = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  const toggle = useCallback(() => {
    if (openRef.current) {
      close();
      return;
    }
    openRef.current = true;
    setOpen(true);
  }, [close]);

  return (
    <>
      <header className="glass-panel lg:hidden sticky top-0 z-sidebar flex items-center gap-2 border-b border-outline-variant/30 px-margin-mobile py-2">
        <button
          ref={buttonRef}
          onClick={toggle}
          aria-label="Menu"
          aria-expanded={open}
          aria-controls={MENU_ID}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-primary"
        >
          <span aria-hidden="true" className="material-symbols-outlined">menu</span>
        </button>
        <span className="type-headline-sm text-primary tracking-tighter">Call Time</span>
      </header>

      <MobileMenu id={MENU_ID} open={open} onClose={close} />
    </>
  );
}
