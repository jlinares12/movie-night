interface Props {
    label: string;
    isDisabled?: boolean;
    onClick?: () => void;
    icon?: string;
    size?: 'md' | 'lg';
}

export default function OutlinedButton({ label, isDisabled, onClick, icon, size = 'md' }: Props) {
    const sizeClasses = size === 'lg'
        ? 'w-full py-4 type-headline-sm'
        : 'px-6 py-3 type-label-md';

    return (
        <button
            className={`flex items-center justify-center gap-2 rounded-xl border border-outline-variant text-on-surface bg-transparent hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses}`}
            disabled={isDisabled}
            onClick={onClick}
        >
            {icon && <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>}
            {label}
        </button>
    );
}