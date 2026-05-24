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
    <div className="grid grid-flow-row grid-row-2 gap-12">
      <div className="flex flex-col gap-5">
        <div className="pl-8">
          <h1 className="type-display-lg text-[var(--primary-color)]">Your Groups</h1>
        </div>
        <div className="border border-[var(--primary-color)] rounded-[10px] p-8">
          <MovieGroups refreshRef={refreshRef} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-24 pt-8">
        <div className="flex flex-col gap-5">
          <div className="pl-4">
            <h1 className="type-display-lg text-[var(--primary-color)]">Create a Group</h1>
          </div>
          <CreateGroup onCreated={refresh} />
        </div>
        <div className="flex flex-col gap-5">
          <div className="pl-4">
            <h1 className="type-display-lg text-[var(--primary-color)]">Join a Group</h1>
          </div>
          <JoinGroup onJoined={refresh} />
        </div>
      </div>
    </div>
  );
}
