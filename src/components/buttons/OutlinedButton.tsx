interface Props {
    label: string;
}

export default function OutlinedButton({label}: Props) {
    return (
        <button className="border border-[var(--primary-color)] rounded-[10px] text-[var(--primary-color)] text-sm font-extrabold p-3 min-w-[75px]">
            {label}
        </button>
    )
}