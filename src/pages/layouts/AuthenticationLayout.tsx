import { Link, Outlet } from "react-router-dom";
import { Movie } from "@mui/icons-material";

const FOOTER_LINKS = ['About', 'Github', 'Contact us', 'Privacy'];

/**
 * Shell for `/login` and `/register` — the only routes outside `MainLayout`.
 *
 * `min-h-screen` on the outer column rather than `h-screen` on both it and the content
 * row: the old nesting was a full viewport of content *plus* the footer inside a
 * viewport-high box, so every auth page scrolled vertically by the footer's height.
 */
export default function AuthenticationLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      {/*
       * Column below `lg`, row above. The old `gap-[10em]` was the whole 375px bug:
       * flex items shrink, gaps do not, so 160px of gutter survived every viewport and
       * put the document 210px over. Kept at `lg` and up, where it is the intended
       * desktop composition.
       */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-lg lg:gap-[10em] px-margin-mobile lg:px-margin-desktop py-lg">
        <div className="flex flex-col items-center gap-md">
          <h1 className="type-display-lg-mobile lg:type-display-lg text-primary">Call Time</h1>
          {/* Desktop only — at 375px this 250px glyph pushes Clerk's submit button below the fold. */}
          <div className="hidden lg:block w-[300px] h-[250px]">
            <Movie style={{ width: '100%', height: '100%', color: 'rgb(var(--color-primary))' }}/>
          </div>
        </div>
        <Outlet />
      </div>
      <footer className="flex flex-wrap items-center justify-center gap-x-md px-margin-mobile py-2">
        {FOOTER_LINKS.map((label) => (
          <Link
            key={label}
            to={'#'}
            className="type-label-sm inline-flex min-h-11 items-center px-2 transition-colors hover:text-primary"
          >
            {label}
          </Link>
        ))}
      </footer>
    </div>
  )
};
