import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { listGroups } from "../services/groups";
import type { GroupSummary } from "../types/groups";

export default function GroupList() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);

  useEffect(() => {
    listGroups().then((res) => setGroups(res.data)).catch(() => {});
  }, []);

  if (groups.length === 0) {
    return (
      <aside className="p-4">
        <p className="text-sm text-[var(--member-color)]">No groups.</p>
      </aside>
    );
  }

  return (
    <aside className="p-4">
      <h2 className="text-sm font-bold text-[var(--member-color)] uppercase tracking-widest mb-3">
        Your Groups
      </h2>
      <ul className="flex flex-col gap-1">
        {groups.map((g) => (
          <li key={g.id}>
            <NavLink
              to={`/group/${g.id}`}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-[8px] text-sm truncate transition-colors ${
                  isActive
                    ? 'bg-[var(--primary-color)] text-black font-bold'
                    : 'text-[var(--text-color)] hover:bg-[var(--primary-gray)]'
                }`
              }
            >
              {g.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}
