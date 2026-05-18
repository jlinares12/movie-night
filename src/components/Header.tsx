import { useClerk, useUser } from "@clerk/clerk-react"
import { Link } from "react-router-dom";
import { Movie, Notifications, AccountCircle, Logout as LogoutIcon } from "@mui/icons-material";
import NavLink from "./NavLink";

export default function Header() {
    const { user } = useUser();
    const { signOut } = useClerk()

    return (
        <header className="h-[65px] flex items-center grid grid-cols-3 pr-8 pl-8">
            <div className="justify-self-start">
                <Link to="/">
                    <NavLink
                        icon={(className) => <Movie className={className} htmlColor="#40D952"/>}
                        label="Movie Nights"
                    />
                </Link>
            </div>
            <div className="justify-self-center text-[var(--text-color)]">
                <h1>{user?.username}</h1>
            </div>
            <div className="grid grid-cols-3 justify-self-end gap-4">
                    <Notifications className="w-[20px] h-[20px]" htmlColor="#40D952"/>
                    <Link to={"/profile"}>
                        <NavLink
                            icon={(className) => <AccountCircle className={className} htmlColor="#40D952"/>}
                            label=""
                        />
                    </Link>
                    <button onClick={() => signOut({ redirectUrl: '/login' })}>
                        <NavLink
                            icon={(className) => <LogoutIcon className={className} htmlColor="#d60303ff"/>}
                            label=""
                        />
                    </button>
            </div>
        </header>
    )
}