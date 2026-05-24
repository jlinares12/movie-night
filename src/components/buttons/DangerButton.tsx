interface Props {
    label: string;
    isDisabled?: boolean;
    onClick?: () => void;
    icon?: string;
    size?: 'md' | 'lg';
}

export default function DangerButton({ label, isDisabled, onClick, icon, size = 'md' }: Props) {
    const sizeClasses = size === 'lg'
        ? 'w-full py-4 type-headline-sm'
        : 'px-6 py-3 type-label-md';

    return (
        <button
            className={`flex items-center justify-center gap-2 rounded-xl bg-error-container/20 text-error border border-error/30 hover:bg-error-container/40 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses}`}
            disabled={isDisabled}
            onClick={onClick}
        >
            {icon && <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>}
            {label}
        </button>
    );
}