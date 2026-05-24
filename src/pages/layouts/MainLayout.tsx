import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { useBackendAuth } from "../../hooks/useBackendAuth";

export default function MainLayout() {
  const { sessionReady } = useBackendAuth();
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <main className="ml-64 min-h-screen px-margin-desktop py-lg overflow-y-auto">
        {sessionReady ? <Outlet /> : null}
      </main>
    </div>
  );
}
