interface Props {
    label: string;
}

export default function DangerButton({label}: Props) {
    return (
        <button className="bg-red-500 rounded-[10px] text-[var(--text-color)] text-sm font-extrabold p-3">
            {label}
        </button>
    )
}