interface Props {
    icon: string;
    title: string;
    onClick?: () => void;
    isDisabled?: boolean;
    variant?: 'default' | 'secondary' | 'danger';
    loading?: boolean;
    size?: number;
}

const VARIANT_CLASSES: Record<string, string> = {
    default:   'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest',
    secondary: 'text-on-surface-variant hover:text-secondary hover:bg-surface-container-highest',
    danger:    'text-on-surface-variant hover:text-error hover:bg-error/10',
};

/**
 * The only affordance for promote, demote, remove member, leave group and regenerate
 * invite — so two things about it are load-bearing rather than cosmetic:
 *
 * 1. `min-h-11 min-w-11` (44px) at *every* breakpoint, not just below `lg`. WCAG 2.5.8 is
 *    about pointer input generally; a 28x28 target is as bad with a trackpad. Sized to
 *    stay under `MemberList`'s 48px avatar row and level with `InviteCodePanel`'s `h-11`
 *    copy button, so neither skeleton's arithmetic moves.
 * 2. `aria-label={title}` with the glyph `aria-hidden`. A Material Symbols ligature *is*
 *    text, and `title` is only a fallback — so without these the button announced itself
 *    as "person remove" rather than "Remove member". `title` stays for the tooltip (and
 *    because the suite reaches these by it).
 */
export default function IconButton({ icon, title, onClick, isDisabled, variant = 'default', loading, size = 16 }: Props) {
    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            title={title}
            aria-label={title}
            className={`inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]}`}
        >
            <span
                aria-hidden="true"
                className={`material-symbols-outlined${loading ? ' animate-spin' : ''}`}
                style={{ fontSize: `${size}px` }}
            >
                {icon}
            </span>
        </button>
    );
}
