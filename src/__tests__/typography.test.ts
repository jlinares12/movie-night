import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * The type scale is implemented once — as the `.type-*` classes in `src/index.css`.
 *
 * It used to be implemented twice: an identical set of size tokens lived in
 * `tailwind.config.js`'s `theme.extend.fontSize`. The values matched byte for byte, but
 * the two mechanisms did not — the `.type-*` classes also set font-family and a default
 * colour, and the config tokens set neither, so a headline step applied to a `<p>` or a
 * `<span>` silently rendered in Inter rather than the Montserrat DESIGN.md calls for.
 * Those tokens are gone.
 *
 * This test exists because removing them is silent. Tailwind emits no rule for a class it
 * does not recognise and reports no error — it just drops it, and the element falls back
 * to whatever it inherits. Neither `npm run build` nor ESLint catches that. The repo
 * already carried one instance of exactly this bug for the lifetime of the file: a
 * `body-sm` step that was never defined in either scale sat in `NominationCard.tsx`
 * generating nothing at all.
 *
 * So: the retired names must not reappear behind a `text-` prefix. Anything genuinely new
 * belongs in `index.css` as a `.type-*` class, not in the Tailwind config.
 */

/** The eight retired tokens, plus `body-sm` — which was never defined in either scale. */
const RETIRED = [
  'display-lg-mobile',
  'display-lg',
  'headline-md',
  'headline-sm',
  'body-lg',
  'body-md',
  'body-sm',
  'label-md',
  'label-sm',
] as const;

/*
 * Assembled at runtime rather than written out, so this file does not contain the very
 * strings it is looking for. Matches an optional breakpoint prefix, so `lg:` and `md:`
 * variants are caught too, and is ordered longest-first so `display-lg-mobile` is not
 * swallowed by `display-lg`.
 */
const FORBIDDEN = new RegExp(String.raw`\b(?:\w+:)?text-(?:${RETIRED.join('|')})\b`, 'g');

const SRC = join(__dirname, '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(full) ? [full] : [];
  });
}

describe('typography scale', () => {
  test('no source file references a retired text-* type token', () => {
    // Arrange — every .ts/.tsx under src/, including the tests, since a stale class
    // assertion is its own kind of rot. This file is the one exemption: its prose has to
    // be able to name the thing it forbids.
    const files = sourceFiles(SRC).filter((file) => file !== __filename);

    // Act
    const offenders = files.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, i) => {
          const hits = line.match(FORBIDDEN);
          return hits ? [`${relative(SRC, file)}:${i + 1} — ${hits.join(', ')}`] : [];
        }),
    );

    // Assert — the file count guards the guard: a broken walk would return no files and
    // therefore no offenders, passing vacuously.
    expect(files.length).toBeGreaterThan(50);
    expect(offenders).toEqual([]);
  });
});
