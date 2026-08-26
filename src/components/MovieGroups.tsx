import { useState, useEffect, useCallback, type RefObject } from "react";
import GroupLink, { GroupLinkSkeleton } from "./GroupLink";
import { listGroups } from "../services/groups";
import type { GroupSummary } from "../types/groups";

/**
 * Layout only — shared so the skeleton row and the real row use the same grid.
 *
 * Twelve tracks at every breakpoint used to fit at 375px only by coincidence: `gap-gutter`
 * is 16px, so 11 gaps = 176px of a 335px box, and `GroupLink`'s `col-span-12` spanned all
 * twelve tracks back to exactly 335px. Two files agreeing by accident is not a layout.
 */
const GRID = 'grid grid-cols-1 md:grid-cols-12 gap-gutter mb-xl';

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
      <div className={GRID}>
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
    <div className={GRID}>
      {groups.map((g) => (
        <GroupLink key={g.id} group={g} onLeave={fetch} />
      ))}
    </div>
  );
}
