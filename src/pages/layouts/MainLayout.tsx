import { Outlet } from "react-router-dom";
import Header from "../../components/Header";
import SideBar from "../../components/SideBar";

export default function MainLayout() {
    return (
        <div className="h-screen bg-[var(--bk-color)] text-white flex flex-col">
            <Header/>
            <div className="flex h-full">
                <SideBar/>
                <Outlet/>
            </div>
        </div>
    )
}