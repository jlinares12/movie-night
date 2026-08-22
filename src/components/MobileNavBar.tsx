import { Link, useLocation } from "react-router-dom";
import { primaryNavItems, ACTIVE_ICON_STYLE } from "./navItems";

/**
 * Floating bottom bar carrying the primary destinations — the mobile half of
 * `Sidebar`'s main nav. Glassmorphic per `DESIGN.md`'s nav-bar treatment, and
 * lifted clear of the iPhone home indicator by the safe-area inset (which needs
 * `viewport-fit=cover` in `index.html` to resolve to anything but 0).
 *
 * Sits at `z-sidebar` (50), below `MobileMenu`'s `z-modal` (70), so the sheet
 * covers it.
 */
export default function MobileNavBar() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      className="glass-panel lg:hidden fixed inset-x-margin-mobile z-sidebar rounded-xl border border-outline-variant/30"
    >
      <ul className="flex items-stretch">
        {primaryNavItems.map(({ icon, label, to }) => {
          const isActive = pathname === to;
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-14 items-center justify-center rounded-xl transition-colors ${
                  isActive ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined"
                  style={isActive ? ACTIVE_ICON_STYLE : undefined}
                >
                  {icon}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
