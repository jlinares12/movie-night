interface LogoutProps {
    color: string;
    className: string;
}

export default function LogoutIcon({color, className}: LogoutProps) {
    return (
        <svg
            viewBox="0 -0.03 96 96.05"
            fill="none"
            className={className}
            aria-hidden="true"
            role="img"
            preserveAspectRatio="none">
            <path d="M20.484 54H66a6 6 0 0 0 0-12H20.484l7.758-7.758a6 6 0 0 0-8.484-8.484l-18 18a5.998 5.998 0 0 0 0 8.484l18 18a6 6 0 1 0 8.484-8.484Z"
            fill={color}/>
            <path d="M90 0H42a5.997 5.997 0 0 0-6 6v12a6 6 0 0 0 12 0v-6h36v72H48v-6a6 6 0 0 0-12 0v12a5.997 5.997 0 0 0 6 6h48a5.997 5.997 0 0 0 6-6V6a5.997 5.997 0 0 0-6-6Z"
            fill={color}/>
        </svg>
    )
}