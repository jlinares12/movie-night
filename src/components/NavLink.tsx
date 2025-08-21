import type { ReactNode } from "react";

interface Props {
    icon: (className:string) => ReactNode;
    label: string;
}

export default function NavLink({icon, label}:Props) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-[20px] h-[20px]">
            {icon("w-full h-full")}
            </div>
            {label}
        </div>
    )
}