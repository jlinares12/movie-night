import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FilledButton from "./buttons/FilledButton";
import WarningButton from "./buttons/DangerButton";
import { createSession } from "../services/groups";
import type { Session, UserRole } from "../types/groups";

const STATUS_COLORS: Record<string, string> = {
  open: 'text-green-400',
  voting: 'text-yellow-400',
  decided: 'text-blue-400',
  closed: 'text-[var(--member-color)]',
};

interface Props {
  groupId: number;
  sessions: Session[];
  your_role: UserRole;
  onSessionCreated: (session: Session) => void;
}

export default function SessionList({ groupId, sessions, your_role, onSessionCreated }: Props) {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canManage = your_role === 'owner' || your_role === 'admin';

  const handleCreate = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await createSession(groupId, scheduledFor || undefined);
      onSessionCreated(res.data);
      setShowForm(false);
      setScheduledFor('');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not create session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="type-headline-sm text-[var(--primary-color)]">Sessions</h3>
        {canManage && !showForm && (
          <FilledButton label="New Session" onClick={() => setShowForm(true)} />
        )}
      </div>

      {showForm && (
        <div className="flex flex-col gap-2 border border-[var(--primary-gray)] rounded-[10px] p-4">
          <label className="type-label-md text-[var(--member-color)]">
            Scheduled for (optional)
          </label>
          <input
            type="datetime-local"
            className="border border-[var(--primary-gray)] rounded-[8px] p-2 text-sm bg-transparent text-[var(--text-color)] focus:border-[var(--primary-color)] focus:outline-none"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
          />
          {error && <p className="type-label-md text-red-400">{error}</p>}
          <div className="flex gap-2 mt-1">
            <FilledButton label="Create" onClick={handleCreate} isDisabled={loading} />
            <WarningButton label="Cancel" onClick={() => { setShowForm(false); setError(''); }} />
          </div>
        </div>
      )}

      {sessions.length === 0 && !showForm && (
        <p className="type-label-md text-[var(--member-color)]">No sessions yet.</p>
      )}

      <ul className="divide-y divide-[var(--primary-gray)]">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="py-3 flex items-center justify-between cursor-pointer hover:opacity-80"
            onClick={() => navigate(`/group/${groupId}/session/${s.id}`)}
          >
            <div>
              <span className={`type-label-md font-semibold capitalize ${STATUS_COLORS[s.status]}`}>
                {s.status}
              </span>
              {s.scheduled_for && (
                <span className="type-label-sm text-[var(--member-color)] ml-3">
                  {new Date(s.scheduled_for).toLocaleString()}
                </span>
              )}
            </div>
            <span className="type-label-sm text-[var(--member-color)]">
              {new Date(s.created_at).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
