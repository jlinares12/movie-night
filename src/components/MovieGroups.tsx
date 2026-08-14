import { useState, useEffect, useCallback, type RefObject } from "react";
import GroupLink, { GroupLinkSkeleton } from "./GroupLink";
import { listGroups } from "../services/groups";
import type { GroupSummary } from "../types/groups";

interface Props {
  refreshRef?: RefObject<(() => void) | null>;
}

export default function MovieGroups({ refreshRef }: Props) {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await listGroups();
      setGroups(res.data);
      setLoading(false);
    } catch {
      // 401 redirected globally by axios interceptor
    }
  }, []);

  useEffect(() => {
    fetch();
    if (refreshRef) refreshRef.current = fetch;
  }, [fetch, refreshRef]);

  // Each skeleton owns its own sweep, so they drop straight into the same grid the real
  // cards use. Swapped out on load, never hidden — a `SkeletonGroup`'s `role="status"`
  // lives for as long as it is mounted.
  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-gutter mb-xl">
        <GroupLinkSkeleton />
        <GroupLinkSkeleton />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="mb-xl">
        <p className="type-label-md py-4">
          You have no groups yet. Create one or join with a code.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-gutter mb-xl">
      {groups.map((g) => (
        <GroupLink key={g.id} group={g} onLeave={fetch} />
      ))}
    </div>
  );
}
