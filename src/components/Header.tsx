import { useUser } from "@clerk/clerk-react"
import { Link } from "react-router-dom";
import MovieClapper from "./icons/MovieClapper"
import NotificationIcon from "./icons/NotificationIcon"
import NavLink from "./NavLink";

export default function Header() {
    const {user} = useUser();
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
            <div className="flex w-[30px] h-[30px] justify-self-end">
                <NotificationIcon color="#40D952" className="w-full h-full"/>
            </div>
        </header>
    )
}