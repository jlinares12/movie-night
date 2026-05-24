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

export default function IconButton({ icon, title, onClick, isDisabled, variant = 'default', loading, size = 16 }: Props) {
    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            title={title}
            className={`p-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]}`}
        >
            <span
                className={`material-symbols-outlined${loading ? ' animate-spin' : ''}`}
                style={{ fontSize: `${size}px` }}
            >
                {icon}
            </span>
        </button>
    );
}
