import { Link } from "react-router-dom"
import ProfileIcon from "./icons/ProfileIcon"
import NavLink from "./NavLink"
import { useClerk } from "@clerk/clerk-react"
import CalendarIcon from "./icons/CalendarIcon"
import LogoutIcon from "./icons/LogoutIcon"
import CollapseIcon from "./icons/CollapseIcon"

export default function SideBar() {
    const { signOut } = useClerk()

    return (
        <div id="nav" className="relative top-0 left-0 z-40 w-[175px] h-full flex flex-col justify-between p-8 gap-7">
            <div className="flex flex-col gap-12">
                <Link to={"/profile"}>
                    <NavLink icon={(className) => <ProfileIcon color="#40D952" className={className}/> } label="Profile"/>
                </Link>
                <Link to={"/#"}>
                    <NavLink icon={(className) => <CalendarIcon color="#40D952" className={className}/> } label="Calendar"/>
                </Link>
                <button onClick={() => signOut({ redirectUrl: '/login' })}>
                    <NavLink icon={(className) => <LogoutIcon color="#40D952" className={className}/> } label="Log out"/>
                </button>
            </div>
            <div>
                <button>
                    <NavLink icon={(className) => <CollapseIcon color="#40D952" className={className}/> } label="Collapse"/>
                </button>
            </div>
        </div>
    )
}