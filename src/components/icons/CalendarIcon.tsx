interface CalendarProps {
    color:string;
    className:string;
}

export default function CalendarIcon({color, className}: CalendarProps) {
    return (
        <svg
            viewBox="0 -0.03 24 24.03"
            fill="none"
            className={className}
            aria-hidden="true"
            role="img"
            preserveAspectRatio="none">
            <path d="M20 2h-1V1a1 1 0 0 0-2 0v1H7V1a1 1 0 0 0-2 0v1H4a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h16a4 4 0 0 0 4-4V6a4 4 0 0 0-4-4Zm2 18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1a1 1 0 0 0 2 0V4h10v1a1 1 0 0 0 2 0V4h1a2 2 0 0 1 2 2Z"
            fill={color}/>
            <path d="M19 7H5a1 1 0 0 0 0 2h14a1 1 0 0 0 0-2ZM7 12H5a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2ZM7 17H5a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2ZM13 12h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2ZM13 17h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2ZM19 12h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2ZM19 17h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2Z"
            fill={color}/>
        </svg>
    )
}