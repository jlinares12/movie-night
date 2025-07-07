import type { ReactNode } from "react";

interface Props {
    icon: (className:string) => ReactNode;
    label: string;
}

export default function NavLink({icon, label}:Props) {
    return (
        <div className="flex items-center gap-[15px]">
            <div className="w-[30px] h-[30px]">
            {icon("w-full h-full")}
            </div>
            {label}
        </div>
    )
}