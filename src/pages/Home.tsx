import { useCallback, useRef } from "react";
import CreateGroup from "../components/CreateGroup";
import JoinGroup from "../components/JoinGroup";
import MovieGroups from "../components/MovieGroups";

export default function Home() {
  const refreshRef = useRef<(() => void) | null>(null);

  const refresh = useCallback(() => {
    refreshRef.current?.();
  }, []);

  return (
    <>
      {/* Fixed atmospheric background blurs */}
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-0 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Page header */}
      <header className="mb-xl relative">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <h2 className="type-display-lg mb-2">Your Movie Groups</h2>
        <p className="type-body-lg text-on-surface-variant max-w-2xl">
          Ready for the next feature? Coordinate your picks and get the popcorn ready.
          Check your groups below and start a session when you're ready.
        </p>
      </header>

      {/* Bento grid of group cards */}
      <MovieGroups refreshRef={refreshRef} />

      {/* Bottom actions: Create + Join */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <div className="bg-surface-container-high p-lg rounded-xl border border-outline-variant/10 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
          <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <span className="material-symbols-outlined" style={{ fontSize: '160px' }}>add_circle</span>
          </div>
          <div className="relative z-10">
            <h4 className="type-headline-md mb-2">Create a New Group</h4>
            <p className="type-body-md text-on-surface-variant mb-6">
              Start a new tradition. Invite friends and start voting on movies.
            </p>
            <CreateGroup onCreated={refresh} />
          </div>
        </div>

        <div className="bg-surface-container-high p-lg rounded-xl border border-outline-variant/10 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
          <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <span className="material-symbols-outlined" style={{ fontSize: '160px' }}>key</span>
          </div>
          <div className="relative z-10">
            <h4 className="type-headline-md mb-2">Join with a Code</h4>
            <p className="type-body-md text-on-surface-variant mb-6">
              Received an invite? Enter the access code to join the party.
            </p>
            <JoinGroup onJoined={refresh} />
          </div>
        </div>
      </section>
    </>
  );
}
