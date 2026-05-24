interface Props {
    label: string;
    isDisabled?: boolean;
    onClick?: () => void;
}

export default function OutlinedButton({label, isDisabled, onClick}: Props) {
    return (
        <button
            className={`border rounded-[10px] text-sm font-extrabold p-3 min-w-[75px] ${
                isDisabled ? "border-[var(--primary-gray)] text-[var(--light-gray)] animate-pulse" : "border-[var(--primary-color)] text-[var(--text-color)]"
            }`}
            disabled={isDisabled}
            onClick={onClick}
        >
            {label}
        </button>
    )
}