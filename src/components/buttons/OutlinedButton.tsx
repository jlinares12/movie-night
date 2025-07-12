interface Props {
    label: string;
    isDisabled?: boolean;
}

export default function OutlinedButton({label, isDisabled}: Props) {
    return (
        <button className={`border rounded-[10px] text-sm font-extrabold p-3 min-w-[75px] ${
            isDisabled ? "border-[var(--primary-gray)] text-[var(--light-gray)] animate-pulse" : "border-[var(--primary-color)] text-[var(--text-color)]"
        }`} disabled = {isDisabled}
        >
            {label}
        </button>
    )
}