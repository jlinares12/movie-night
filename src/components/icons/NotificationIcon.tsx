interface NotificationProp {
    color:string;
    className:string;
}

export default function NotificationIcon({color, className}:NotificationProp) {
    return (
        <svg
            viewBox="3.98 3 24.03 26"
            fill="none"
            className={className}
            aria-hidden="true"
            role="img"
            preserveAspectRatio="none">
            <g data-name="Layer 2">
                <path d="M16 29a4 4 0 0 1-4-4 1 1 0 0 1 1-1h6a1 1 0 0 1 1 1 4 4 0 0 1-4 4Zm-1.73-3a2 2 0 0 0 3.46 0ZM18 7h-4a1 1 0 0 1-1-1 3 3 0 0 1 6 0 1 1 0 0 1-1 1Zm-2-2Z"
                fill={color}/>
                <path d="M27 26H5a1 1 0 0 1-1-1 7 7 0 0 1 3-5.75V14a9 9 0 0 1 8.94-9h.11a9 9 0 0 1 9 9v5.25A7 7 0 0 1 28 25a1 1 0 0 1-1 1ZM6.1 24h19.8a5 5 0 0 0-2.4-3.33 1 1 0 0 1-.5-.87V14a7 7 0 1 0-14 0v5.8a1 1 0 0 1-.5.87A5 5 0 0 0 6.1 24Z"
                fill={color}/>
            </g>
        </svg>
    )
}
