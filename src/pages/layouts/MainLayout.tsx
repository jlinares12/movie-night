import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import MobileTopBar from "../../components/MobileTopBar";
import MobileNavBar from "../../components/MobileNavBar";
import { useBackendAuth } from "../../hooks/useBackendAuth";

export default function MainLayout() {
  const { sessionReady } = useBackendAuth();
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <MobileTopBar />
      {/*
       * `pb-32` clears the floating bottom bar (56px tall, sitting 1rem plus the
       * safe-area inset off the bottom); `px-margin-mobile` is the 20px gutter
       * DESIGN.md specifies for mobile. `ComingSoon`'s negative insets cancel
       * this padding and must stay in step with it.
       */}
      <main className="lg:ml-64 min-h-screen px-margin-mobile lg:px-margin-desktop py-lg pb-32 lg:pb-lg overflow-y-auto">
        {sessionReady ? <Outlet /> : null}
      </main>
      <MobileNavBar />
    </div>
  );
}
