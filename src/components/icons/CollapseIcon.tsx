interface Props {
    color: string;
    className: string;
}

export default function CollapseIcon({color, className}: Props) {
    return (
        <svg
            viewBox="34 34 444 444"
            fill="none"
            className={className}
            aria-hidden="true"
            role="img"
            preserveAspectRatio="none">
            <path d="M414.11 186.39h-88.5v-88.5h29.92v37.43L456.84 34 478 55.16 376.68 156.47h37.43Zm0 169.14v-29.92h-88.5v88.5h29.92v-37.43L456.84 478 478 456.84 376.68 355.53Zm-316.22 0h37.43L34 456.84 55.16 478l101.31-101.32v37.43h29.92v-88.5h-88.5Zm58.58-220.21L55.16 34 34 55.16l101.32 101.31H97.89v29.92h88.5v-88.5h-29.92Z"
            fill={color}/>
        </svg>
    )
}