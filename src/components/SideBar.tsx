import { Link } from "react-router-dom"
import { useClerk } from "@clerk/clerk-react"
import ProfileIcon from "./icons/ProfileIcon"
import NavLink from "./NavLink"
import CalendarIcon from "./icons/CalendarIcon"
import LogoutIcon from "./icons/LogoutIcon"
import CollapseIcon from "./icons/CollapseIcon"
import { useState } from "react"
import ExpandIcon from "./icons/ExpandIcon"

export default function SideBar() {
    const { signOut } = useClerk()
    const [isCollapsed, setIsCollapsed] = useState(false)

    const collapse = () => {
        setIsCollapsed(!isCollapsed)
    }

    return (
        <div
            id="nav"
            className={`relative top-0 left-0 z-40 h-full flex flex-col justify-between p-8 gap-7 ${
                isCollapsed ? "w-[65px] overflow-hidden items-right" : "w-[175px]"
            }`}
        >
            <div
                id="links"
                className={`flex flex-col gap-12 ${
                    isCollapsed ? "w-[30px] h-[30px]" : ""
                }`}
            >
                <Link to={"/profile"}>
                    <NavLink
                        icon={(className) => <ProfileIcon color="#40D952" className={className}/>}
                        label={isCollapsed ? "" : "Profile"}
                    />
                </Link>
                <Link to={"/#"}>
                    <NavLink
                        icon={(className) => <CalendarIcon color="#40D952" className={className}/>}
                        label={isCollapsed ? "" : "Calendar"}
                    />
                </Link>
                <button onClick={() => signOut({ redirectUrl: '/login' })}>
                    <NavLink
                        icon={(className) => <LogoutIcon color="#40D952" className={className}/>}
                        label={isCollapsed ? "" : "Log out"}
                    />
                </button>
            </div>
            <div>
                <button onClick={collapse}>
                    {
                        isCollapsed ?
                        <NavLink
                        icon={(className) => <ExpandIcon color="#40D952" className={className}/>}
                        label=""
                    />:
                        <NavLink
                        icon={(className) => <CollapseIcon color="#40D952" className={className}/>}
                        label={isCollapsed ? "" : "Collapse"}
                    />
                    }
                </button>
            </div>
        </div>
    )
}