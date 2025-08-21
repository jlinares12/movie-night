import { useClerk, useUser } from "@clerk/clerk-react"
import { Link } from "react-router-dom";
import MovieClapper from "./icons/MovieClapper"
import NotificationIcon from "./icons/NotificationIcon"
import ProfileIcon from "./icons/ProfileIcon";
import LogoutIcon from "./icons/LogoutIcon";
import NavLink from "./NavLink";

export default function Header() {
    const { user } = useUser();
    const { signOut } = useClerk()

    return (
        <header className="h-[65px] flex items-center grid grid-cols-3 pr-8 pl-8">
            <div className="justify-self-start">
                <Link to="/">
                    <NavLink
                        icon={(className) => <MovieClapper color="#40D952" className={className}/>}
                        label="Movie Nights"
                    />
                </Link>
            </div>
            <div className="justify-self-center text-[var(--text-color)]">
                <h1>{user?.username}</h1>
            </div>
            <div className="grid grid-cols-3 justify-self-end gap-4">
                    <NotificationIcon color="#40D952" className="w-[20px] h-[20px]"/>
                    <Link to={"/profile"}>
                        <NavLink
                            icon={(className) => <ProfileIcon color="#40D952" className={className}/>}
                            label=""
                        />
                    </Link>
                    <button onClick={() => signOut({ redirectUrl: '/login' })}>
                        <NavLink
                            icon={(className) => <LogoutIcon color="#d60303ff" className={className}/>}
                            label=""
                        />
                    </button>
            </div>
        </header>
    )
}