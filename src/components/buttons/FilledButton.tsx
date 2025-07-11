interface Props {
    label: string;
}

export default function FilledButton({label}: Props) {
    return (
        <button className="bg-[var(--primary-color)] rounded-[10px] text-[var(--text-color)] text-sm font-extrabold p-3 min-w-[75px]">
            {label}
        </button>
    )
}