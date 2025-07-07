interface ProfileIconProps {
    color:string;
    className:string;
}

export default function ProfileIcon({color, className}: ProfileIconProps) {
    return(
        <svg
            viewBox="4 1 40 46"
            fill="none"
            className={className}
            aria-hidden="true"
            role="img"
            preserveAspectRatio="none">
            <path d="M24 21a10 10 0 1 1 10-10 10 10 0 0 1-10 10Zm0-16a6 6 0 1 0 6 6 6 6 0 0 0-6-6ZM42 47H6a2 2 0 0 1-2-2v-6a16 16 0 0 1 16-16h8a16 16 0 0 1 16 16v6a2 2 0 0 1-2 2ZM8 43h32v-4a12 12 0 0 0-12-12h-8A12 12 0 0 0 8 39Z"
            fill={color}/>
        </svg>
    )
}