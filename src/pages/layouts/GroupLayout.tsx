import { Outlet } from "react-router-dom";
import RightSidebar from "../../components/RightSidebar";
import GroupList from "../../components/GroupList";
import Header from "../../components/Header";

export default function GroupLayout() {
    return (
        <div className="h-screen bg-[var(--bk-color)] text-white ">
            <Header/>
            <div className="grid grid-cols-3">
                <GroupList/>
                <Outlet/>
                <RightSidebar/>
            </div>
        </div>
    )
}