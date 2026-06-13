import { Link, useLocation } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import api from "../utils/api";

const navLinks = [
  { icon: 'group', label: 'My Groups', to: '/', activePath: '/' },
  { icon: 'explore', label: 'Discover', to: '#', activePath: null },
  { icon: 'person', label: 'Profile', to: '/profile', activePath: '/profile' },
];

export default function Sidebar() {
  const location = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleLogout = async () => {
    await api.delete('/api/auth/session');
    signOut({ redirectUrl: '/login' });
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container shadow-xl flex flex-col py-lg px-4 z-50">
      <div className="mb-10 px-2">
        <h1 className="type-display-lg-mobile text-primary tracking-tighter">Call Time</h1>
        <p className="type-label-sm opacity-70">Cinematic Coordination</p>
      </div>

      <nav className="flex-grow space-y-2">
        {navLinks.map(({ icon, label, to, activePath }) => {
          const isActive = activePath !== null && location.pathname === activePath;
          return (
            <Link
              key={label}
              to={to}
              className={`flex items-center gap-4 p-3 transition-all active:translate-x-1 ${
                isActive
                  ? 'bg-secondary-container text-primary rounded-xl border-l-4 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary rounded-xl'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
              >
                {icon}
              </span>
              <span className="type-label-md">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8 border-t border-outline-variant/30 space-y-2">
        <Link to="#" className="flex items-center gap-4 text-on-surface-variant p-3 hover:bg-surface-variant hover:text-primary transition-all">
          <span className="material-symbols-outlined">settings</span>
          <span className="type-label-md">Settings</span>
        </Link>
        <Link to="#" className="flex items-center gap-4 text-on-surface-variant p-3 hover:bg-surface-variant hover:text-primary transition-all">
          <span className="material-symbols-outlined">help</span>
          <span className="type-label-md">Help</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 text-on-surface-variant p-3 hover:bg-surface-variant hover:text-primary transition-all w-full text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="type-label-md">Logout</span>
        </button>
        {user?.username && (
          <p className="px-3 pt-2 type-label-sm opacity-50">{user.username}</p>
        )}
      </div>
    </aside>
  );
}
