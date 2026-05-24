import { useNavigate } from "react-router-dom";
import OutlinedButton from "./buttons/OutlinedButton";
import FilledButton from "./buttons/FilledButton";
import WarningButton from "./buttons/DangerButton";
import { removeMember } from "../services/groups";
import { useCurrentUser } from "../hooks/useCurrentUser";
import type { GroupSummary } from "../types/groups";

interface Props {
  group: GroupSummary;
  onLeave: () => void;
}

export default function GroupLink({ group, onLeave }: Props) {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  const formattedDate = new Date(group.created_at).toLocaleDateString();

  const handleLeave = async () => {
    if (!currentUser) return;
    if (!confirm(`Leave "${group.name}"?`)) return;
    try {
      await removeMember(group.id, currentUser.id);
      onLeave();
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Could not leave group.';
      alert(msg);
    }
  };

  return (
    <li className="grid grid-cols-3 items-center pb-8 pt-8">
      <div className="flex">
        <div className="cl-group-name text-2xl text-[var(--name-color)] font-extrabold">
          <h2>{group.name}</h2>
        </div>
      </div>
      <div>
        <div className="text-sm text-[var(--member-color)]">
          <p>{group.member_count} {group.member_count === 1 ? 'member' : 'members'}</p>
        </div>
        <div className="text-sm text-[var(--text-color)]">
          <p>Created: {formattedDate}</p>
        </div>
        <div className="text-xs text-[var(--member-color)] mt-1 capitalize">
          <p>You: {group.your_role}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <OutlinedButton label="Nominate Movie" isDisabled />
        <FilledButton label="Open" onClick={() => navigate(`/group/${group.id}`)} />
        <WarningButton label="Leave Group" onClick={handleLeave} />
      </div>
    </li>
  );
}
