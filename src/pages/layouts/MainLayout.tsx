import { Outlet } from "react-router-dom";
import Header from "../../components/Header";

export default function MainLayout() {
    return (
        <div className="h-screen bg-[var(--bk-color)] text-white flex flex-col">
            <Header/>
            <div className="flex h-full">
                <div className="w-full fixed flex flex-col items-center pt-8 overflow-scroll">
                    <Outlet/>
                </div>
            </div>
        </div>
    )
}