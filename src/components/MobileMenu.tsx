import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { secondaryNavItems, ACTIVE_ICON_STYLE } from "./navItems";
import { useLogout } from "../hooks/useLogout";

interface Props {
  open: boolean;
  /** Must be stable — the route-change effect below depends on it. */
  onClose: () => void;
  /** Matches the hamburger's `aria-controls`. */
  id: string;
}

/**
 * The sheet behind the hamburger: the destinations that live in `Sidebar`'s
 * `mt-auto` cluster on desktop. Sits at `z-modal` (70) so it covers
 * `GlobalLoadingBar` at 60 and the bottom bar at 50.
 */
export default function MobileMenu({ open, onClose, id }: Props) {
  const { pathname } = useLocation();
  const { user } = useUser();
  const logout = useLogout();
  const panelRef = useRef<HTMLDivElement>(null);

  /*
   * Close on navigation. This also fires on mount, which is a no-op: `onClose`
   * bails when the sheet is already shut, so React never re-renders for it.
   */
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  /* Escape to close, and lock the page behind the sheet while it is open. */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  /* Move focus into the sheet; `MobileTopBar` returns it to the hamburger on close. */
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-modal">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-background/80"
      />

      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
        className="glass-panel absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-outline-variant/30 py-lg px-4 outline-none"
      >
        <div className="mb-10 px-2">
          <h2 className="type-display-lg-mobile text-primary tracking-tighter">Call Time</h2>
          <p className="type-label-sm opacity-70">Cinematic Coordination</p>
        </div>

        <nav aria-label="Secondary" className="space-y-2">
          {secondaryNavItems.map(({ icon, label, to }) => {
            const isActive = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-11 items-center gap-4 p-3 transition-all ${
                  isActive
                    ? "bg-secondary-container text-primary border-l-4 border-primary"
                    : "text-on-surface-variant hover:bg-surface-variant hover:text-primary"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined"
                  style={isActive ? ACTIVE_ICON_STYLE : undefined}
                >
                  {icon}
                </span>
                <span className="type-label-md">{label}</span>
              </Link>
            );
          })}

          <button
            onClick={logout}
            className="flex min-h-11 w-full items-center gap-4 p-3 text-left text-on-surface-variant transition-all hover:bg-surface-variant hover:text-primary"
          >
            <span aria-hidden="true" className="material-symbols-outlined">logout</span>
            <span className="type-label-md">Logout</span>
          </button>
        </nav>

        {user?.username && (
          <p className="mt-auto px-3 pt-8 type-label-sm opacity-50">{user.username}</p>
        )}
      </div>
    </div>
  );
}
