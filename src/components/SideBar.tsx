import { Link } from "react-router-dom"
import SignOutButton from "./SignoutButton"
import ProfileIcon from "./icons/ProfileIcon"
import NavLink from "./NavLink"

export default function SideBar() {
    return (
        <div className="relative top-0 left-0 z-40 w-[175px] h-full flex flex-col justify-between p-7 gap-7">
            <Link to={"/profile"}>
                <NavLink children={<ProfileIcon color="#40D952" className=""/>} label="Profile"/>
            </Link>
            <div>
                <SignOutButton/>
            </div>
        </div>
    )
}