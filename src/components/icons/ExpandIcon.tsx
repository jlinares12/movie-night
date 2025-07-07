interface Props {
    color: string;
    className: string;
}

export default function ExpandIcon({color, className}: Props) {
    return (
        <svg
            viewBox="34 34 444 444"
            fill="none"
            className={className}
            aria-hidden="true"
            role="img"
            preserveAspectRatio="none">
            <path d="M478 34v87h-30V85.22l-98.58 98.59-21.22-21.22L426.78 64H391V34Zm-30 392.78-98.58-98.59-21.22 21.22L426.78 448H391v30h87v-87h-30ZM121 64V34H34v87h30V85.22l98.58 98.59 21.22-21.22L85.22 64Zm41.59 264.18L64 426.78V391H34v87h87v-30H85.22l98.59-98.58Z"
            fill={color}/>
        </svg>
    )
}