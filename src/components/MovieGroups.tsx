import { useState, useEffect, useCallback, type RefObject } from "react";
import GroupLinkSkeleton from "./skeletons/GroupLinkSkeleton";
import GroupLink from "./GroupLink";
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

  if (loading) {
    return (
      <div className="divide-y divide-[var(--primary-gray)]">
        <GroupLinkSkeleton/>
        <GroupLinkSkeleton/>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <p className="text-sm text-[var(--member-color)] py-4">
        You have no groups yet. Create one or join with a code.
      </p>
    );
  }

  return (
    <ul className="list-none divide-y divide-[var(--primary-gray)]">
      {groups.map((g) => (
        <GroupLink key={g.id} group={g} onLeave={fetch} />
      ))}
    </ul>
  );
}
