import { Outlet } from "react-router-dom";
import RightSidebar from "../../components/RightSidebar";
import GroupList from "../../components/GroupList";
import Header from "../../components/Header";

export default function GroupLayout() {
    return (
        <div className="h-screen bg-[var(--bk-color)] text-white ">
            <Header/>
            <div className="grid grid-cols-4 flex justify-items-center">
                <GroupList/>
                <div className="col-span-2">
                    <Outlet/>
                </div>
                <RightSidebar/>
            </div>
        </div>
    )
}