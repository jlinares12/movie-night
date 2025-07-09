import { Link } from "react-router-dom";
import NotFoundIcon from "../components/icons/NotFoundIcon";

export default function NotFound() {
    return (
        <div className="h-screen bg-[var(--bk-color)] flex flex-col items-center justify-center">
            <div className="flex justify-between items-center text-[var(--primary-color)] h-[384px]">
                <h1 className="text-[384px]">4</h1>
                <div className="w-96 h-96">
                    <NotFoundIcon color="#40D952" className=""/>
                </div>
                <h1 className="text-[384px]">4</h1>
            </div>
            <div className="text-[var(--text-color)] flex flex-col justify-between gap-5">
                <p className="text-4xl">The page you entered cannot be found</p>
                <Link to={"/"} className="text-xl self-center p-2 outline outline-[var(--primary-color)] rounded-md">
                    <button>Return Home</button>
                </Link>
            </div>
        </div>
    )
}