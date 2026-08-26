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
       *
       * Deliberately no `overflow-y-auto`. `min-h-screen` is a minimum, so this
       * element grows with its content and never scrolls internally — the only
       * thing that class did was make <main> a *horizontal* scroll container
       * (per the CSS overflow spec a `visible` axis computes to `auto` when the
       * other axis is not `visible`), quietly swallowing overflow that belongs
       * on the document where it is visible.
       */}
      <main className="lg:ml-64 min-h-screen px-margin-mobile lg:px-margin-desktop py-lg pb-32 lg:pb-lg">
        {sessionReady ? <Outlet /> : null}
      </main>
      <MobileNavBar />
    </div>
  );
}
