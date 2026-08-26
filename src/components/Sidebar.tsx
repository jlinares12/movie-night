import { Link, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { primaryNavItems, secondaryNavItems, ACTIVE_ICON_STYLE } from "./navItems";
import { useLogout } from "../hooks/useLogout";

/**
 * Desktop nav. Hidden below `lg`, where `MobileTopBar` / `MobileMenu` /
 * `MobileNavBar` carry the same destinations from the same lists in
 * `./navItems`.
 */
export default function Sidebar() {
  const location = useLocation();
  const { user } = useUser();
  const logout = useLogout();

  return (
    <aside className="hidden lg:flex h-screen w-64 fixed left-0 top-0 bg-surface-container shadow-xl flex-col py-lg px-4 z-sidebar">
      <div className="mb-10 px-2">
        <h1 className="type-display-lg-mobile text-primary tracking-tighter">Call Time</h1>
        <p className="type-label-sm opacity-70">Cinematic Coordination</p>
      </div>

      <nav className="flex-grow space-y-2">
        {primaryNavItems.map(({ icon, label, to }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={label}
              to={to}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-4 p-3 transition-all active:translate-x-1 ${
                isActive
                  ? 'bg-secondary-container text-primary rounded-xl border-l-4 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary rounded-xl'
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
      </nav>

      <div className="mt-auto pt-8 border-t border-outline-variant/30 space-y-2">
        {/* Same active treatment as the nav links above, minus their rounded corners. */}
        {secondaryNavItems.map(({ icon, label, to }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={label}
              to={to}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-4 p-3 transition-all ${
                isActive
                  ? 'bg-secondary-container text-primary border-l-4 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary'
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
          className="flex items-center gap-4 text-on-surface-variant p-3 hover:bg-surface-variant hover:text-primary transition-all w-full text-left"
        >
          <span aria-hidden="true" className="material-symbols-outlined">logout</span>
          <span className="type-label-md">Logout</span>
        </button>
        {user?.username && (
          <p className="px-3 pt-2 type-label-sm opacity-50">{user.username}</p>
        )}
      </div>
    </aside>
  );
}
