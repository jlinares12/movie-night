interface Props {
    label: string;
    isDisabled?: boolean;
}

export default function FilledButton({label, isDisabled}: Props) {
    return (
        <button className={`rounded-[10px] text-sm font-extrabold p-3 min-w-[75px] ${
            isDisabled ? "bg-[var(--primary-gray)] text-[var(--light-gray)] animate-pulse" : "bg-[var(--primary-color)] text-[var(--text-color)]"
        }`} disabled = {isDisabled}
        >
            {label}
        </button>
    )
}