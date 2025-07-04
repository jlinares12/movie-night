import { Outlet, Link } from "react-router-dom";
import { SignOutButton } from "@clerk/clerk-react";

export default function Layout() {
  return (
    <div className="h-screen bg-[var(--bk-color)] text-[var(--text-color)] flex items-center justify-center">
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link to="/tech-stack">Tech Stack</Link>
          </li>
          <li>
            <SignOutButton/>
          </li>
        </ul>
      </nav>

      <Outlet />
    </div>
  )
};
