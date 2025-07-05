import type { ReactNode } from "react";

interface Props {
    children: ReactNode;
    label: string;
}

export default function NavLink({children, label}:Props) {
    return (
        <div className="flex items-center gap-[15px]">
            <div className="w-[30px] h-[30px]">
            {children}
            </div>
            {label}
        </div>
    )
}