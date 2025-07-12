interface Props {
    label: string;
    isDisabled?: boolean;
}

export default function DangerButton({label, isDisabled}: Props) {
    return (
        <button className={`rounded-[10px] text-sm font-extrabold p-3 min-w-[75px] ${
            isDisabled ? "text-[var(--light-gray)] animate-pulse" : "bg-red-500 text-[var(--text-color)]"
        }`} disabled = {isDisabled}
        >
            {label}
        </button>
    )
}