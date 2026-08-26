import { Link } from "react-router-dom";
import { SearchOff } from "@mui/icons-material";

/*
 * One fluid step for all three glyphs — the two `4`s and the icon between them — declared
 * once so they cannot drift apart, the same reason `NominationCard.tsx`'s `POSTER` is a
 * constant. Tailwind's JIT picks these up because they are complete literal strings.
 *
 * `min()` rather than an `lg:` breakpoint: three 384px glyphs need ~1150px plus the gutter,
 * so a step at 1024px would still overflow a laptop. Below the cap the row is 66vw at every
 * width, which clears both gutters (66vw + 40px mobile <= 100vw for anything wider than
 * ~118px; 66vw + 128px <= 100vw from `lg` up).
 *
 * `leading-none` is what makes that arithmetic honest — the `h1` base rule is
 * `line-height: 1.15`, so without it a 384px glyph paints a 441px line box.
 */
const GLYPH = 'text-[min(22vw,384px)] leading-none';
const GLYPH_BOX = 'w-[min(22vw,384px)] h-[min(22vw,384px)]';

export default function NotFound() {
    return (
        /*
         * This route sits at the top level of the router (`main.tsx`), outside both
         * `MainLayout` and `ProtectedRoutes` — so it owns its own shell, and the page gutter
         * every other route inherits from `MainLayout` has to be spelled out here.
         */
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-5 px-margin-mobile lg:px-margin-desktop">
            <div className="flex items-center text-primary">
                <h1 className={GLYPH}>4</h1>
                <div className={GLYPH_BOX}>
                    <SearchOff style={{ width: '100%', height: '100%', color: 'currentColor' }}/>
                </div>
                <h1 className={GLYPH}>4</h1>
            </div>
            <div className="flex flex-col justify-between gap-5">
                <p className="type-body-lg text-center">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable</p>
                {/* `p-2` around `type-headline-sm` lands at 43px — one pixel under the 44px
                    minimum, so the height is pinned rather than derived. */}
                <Link to={"/"} className="type-headline-sm self-center inline-flex items-center justify-center min-h-11 px-4 outline outline-[1px] outline-offset-2 outline-primary rounded-md">
                    Return Home
                </Link>
            </div>
        </div>
    )
}
