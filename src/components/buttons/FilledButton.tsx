interface Props {
    label: string;
    isDisabled?: boolean;
    onClick?: () => void;
    icon?: string;
    size?: 'md' | 'lg';
}

export default function FilledButton({ label, isDisabled, onClick, icon, size = 'md' }: Props) {
    const sizeClasses = size === 'lg'
        ? 'w-full py-4 type-headline-sm shadow-[0_0_20px_rgba(0,230,118,0.2)] hover:shadow-[0_0_30px_rgba(0,230,118,0.4)]'
        : 'px-6 py-3 type-label-md shadow-[0_0_15px_rgba(0,230,118,0.3)]';

    return (
        <button
            className={`flex items-center justify-center gap-2 rounded-xl bg-primary text-on-primary hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses}`}
            disabled={isDisabled}
            onClick={onClick}
        >
            {icon && <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>}
            {label}
        </button>
    );
}