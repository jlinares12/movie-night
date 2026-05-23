import { Outlet } from "react-router-dom";
import Header from "../../components/Header";
import { useBackendAuth } from "../../hooks/useBackendAuth";

export default function MainLayout() {
    const { sessionReady } = useBackendAuth();
    return (
        <div className="h-screen bg-[var(--bk-color)] text-white flex flex-col">
            <Header/>
            <div className="flex h-full">
                <div className="w-full fixed flex flex-col items-center pt-8 overflow-scroll">
                    {sessionReady ? <Outlet/> : null}
                </div>
            </div>
        </div>
    )
}