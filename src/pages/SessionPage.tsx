import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSession, updateSession, deleteSession, getGroup } from "../services/groups";
import { useGroupEvents } from "../hooks/useGroupEvents";
import FilledButton from "../components/buttons/FilledButton";
import WarningButton from "../components/buttons/DangerButton";
import type { Session, UserRole, SessionStatus } from "../types/groups";

const STATUS_ORDER: SessionStatus[] = ['open', 'voting', 'decided', 'closed'];
const NEXT_STATUS: Record<SessionStatus, SessionStatus | null> = {
  open: 'voting',
  voting: 'decided',
  decided: 'closed',
  closed: null,
};
const STATUS_COLORS: Record<SessionStatus, string> = {
  open: 'text-green-400',
  voting: 'text-yellow-400',
  decided: 'text-blue-400',
  closed: 'text-[var(--member-color)]',
};

export default function SessionPage() {
  const { id, sessionId } = useParams<{ id: string; sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [yourRole, setYourRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [advancing, setAdvancing] = useState(false);

  const groupId = id ? parseInt(id, 10) : null;
  const sesId = sessionId ? parseInt(sessionId, 10) : null;

  useEffect(() => {
    if (!groupId || !sesId) return;
    Promise.all([getSession(groupId, sesId), getGroup(groupId)])
      .then(([sesRes, grpRes]) => {
        setSession(sesRes.data);
        setYourRole(grpRes.data.your_role);
        setLoading(false);
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 403) setError('Access denied.');
        else if (status === 404) setError('Session not found.');
        else setError('Failed to load session.');
        setLoading(false);
      });
  }, [groupId, sesId]);

  useGroupEvents(groupId ?? 0, {
    onSessionUpdated: (data) => {
      if (data.session_id === sesId) {
        setSession((s) => s ? { ...s, status: data.status as SessionStatus, scheduled_for: data.scheduled_for } : s);
      }
    },
    onSessionDeleted: (data) => {
      if (data.session_id === sesId) navigate(`/group/${groupId}`);
    },
    onGroupDeleted: () => navigate('/'),
  });

  if (loading) return <div className="p-8 text-[var(--member-color)]">Loading…</div>;
  if (error || !session) return <div className="p-8 text-red-400">{error || 'Unknown error.'}</div>;

  const canManage = yourRole === 'owner' || yourRole === 'admin';
  const nextStatus = NEXT_STATUS[session.status as SessionStatus];

  const handleAdvance = async () => {
    if (!nextStatus || !groupId || !sesId) return;
    setAdvancing(true);
    try {
      const res = await updateSession(groupId, sesId, { status: nextStatus });
      setSession(res.data);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Could not advance status.');
    } finally {
      setAdvancing(false);
    }
  };

  const handleDelete = async () => {
    if (!groupId || !sesId) return;
    if (!confirm('Delete this session? All data will be lost.')) return;
    try {
      await deleteSession(groupId, sesId);
      navigate(`/group/${groupId}`);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Could not delete session.');
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      <div>
        <button
          className="text-sm text-[var(--member-color)] hover:text-[var(--text-color)] mb-4"
          onClick={() => navigate(`/group/${groupId}`)}
        >
          ← Back to group
        </button>
        <h1 className="text-2xl font-extrabold text-[var(--primary-color)]">Movie Night Session</h1>
      </div>

      <div className="border border-[var(--primary-gray)] rounded-[10px] p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--member-color)]">Status</span>
          <span className={`text-base font-bold capitalize ${STATUS_COLORS[session.status as SessionStatus]}`}>
            {session.status}
          </span>
        </div>

        {session.scheduled_for && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--member-color)]">Scheduled</span>
            <span className="text-sm text-[var(--text-color)]">
              {new Date(session.scheduled_for).toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--member-color)]">Created</span>
          <span className="text-sm text-[var(--text-color)]">
            {new Date(session.created_at).toLocaleString()}
          </span>
        </div>
      </div>

      {canManage && (
        <div className="flex gap-3">
          {nextStatus && (
            <FilledButton
              label={`Advance to ${nextStatus}`}
              onClick={handleAdvance}
              isDisabled={advancing}
            />
          )}
          <WarningButton label="Delete Session" onClick={handleDelete} />
        </div>
      )}
    </div>
  );
}
