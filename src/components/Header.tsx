import { useClerk, useUser } from "@clerk/clerk-react"
import { Link } from "react-router-dom";
import { Movie, Notifications, AccountCircle, Logout as LogoutIcon } from "@mui/icons-material";
import NavLink from "./NavLink";
import api from "../utils/api";

export default function Header() {
    const { user } = useUser();
    const { signOut } = useClerk()

    return (
        <header className="h-[65px] flex items-center grid grid-cols-3 pr-8 pl-8">
            <div className="justify-self-start">
                <Link to="/">
                    <NavLink
                        icon={(className) => <Movie className={className} style={{ color: 'rgb(var(--color-primary))' }}/>}
                        label="Movie Nights"
                    />
                </Link>
            </div>
            <div className="justify-self-center text-[var(--text-color)]">
                <h1 className="type-body-md">{user?.username}</h1>
            </div>
            <div className="grid grid-cols-3 justify-self-end gap-4">
                    <Notifications className="w-[20px] h-[20px]" style={{ color: 'rgb(var(--color-primary))' }}/>
                    <Link to={"/profile"}>
                        <NavLink
                            icon={(className) => <AccountCircle className={className} style={{ color: 'rgb(var(--color-primary))' }}/>}
                            label=""
                        />
                    </Link>
                    <button onClick={async () => {
                        await api.delete('/api/auth/session');
                        signOut({ redirectUrl: '/login' });
                    }}>
                        <NavLink
                            icon={(className) => <LogoutIcon className={className} style={{ color: 'rgb(var(--color-error))' }}/>}
                            label=""
                        />
                    </button>
            </div>
        </header>
    )
}