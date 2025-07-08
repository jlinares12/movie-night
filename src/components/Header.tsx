import { useUser } from "@clerk/clerk-react"
import { Link } from "react-router-dom";
import MovieClapper from "./icons/MovieClapper"
import NotificationIcon from "./icons/NotificationIcon"
import NavLink from "./NavLink";

export default function Header() {
    const {user} = useUser();
    return (
        <header className="h-[65px] w-full flex flex-row items-center justify-between pr-8 pl-8">
            <div className="flex items-center justify-center gap-[15px]">
                <Link to="/">
                    <NavLink
                        icon={(className) => <MovieClapper color="#40D952" className={className}/>}
                        label="Movie Nights"
                    />
                </Link>
            </div>
            <h1 className="text-[var(--text-color)]">{user?.username}</h1>
            <div className="w-[30px] h-[30px]">
                <NotificationIcon color="#40D952" className="w-[30px] h-[30px]"/>
            </div>
        </header>
    )
}