import { Link } from "react-router-dom";
import NotFoundIcon from "../components/icons/NotFoundIcon";

export default function NotFound() {
    return (
        <div className="h-screen bg-[var(--bk-color)] flex flex-col items-center justify-center gap-5">
            <div className="flex items-center text-[var(--primary-color)] h-[384px]">
                <h1 className="text-[384px]">4</h1>
                <div className="w-[384px] h-[384px]">
                    <NotFoundIcon color="#40D952" className=""/>
                </div>
                <h1 className="text-[384px]">4</h1>
            </div>
            <div className="text-[var(--text-color)] flex flex-col justify-between gap-5">
                <p className="text-lg">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable</p>
                <Link to={"/"} className="text-xl self-center p-2 outline outline-[1px] outline-offset-2 outline-[var(--primary-color)] rounded-md text-lg">
                    Return Home
                </Link>
            </div>
        </div>
    )
}