import { useUser } from "@clerk/clerk-react"
import MovieClapper from "./icons/MovieClapper"
import NotificationIcon from "./icons/NotificationIcon"

export default function Header() {
    const {user} = useUser();
    return (
        <header className="h-[65px] w-full flex flex-row items-center justify-between pr-7 pl-7">
            <div className="flex items-center justify-center gap-[15px]">
                <div className="w-[30px] h-[30px]">
                    <MovieClapper color="#40D952" className="w-full h-full"/>
                </div>
                <p className="text-[var(--text-color)]">Movie Nights</p>
            </div>
            <h1 className="text-[var(--text-color)]">{user?.username}</h1>
            <div className="w-[30px] h-[30px]">
                <NotificationIcon color="#40D952" className="w-full h-full"/>
            </div>
        </header>
    )
}