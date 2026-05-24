import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSession } from "../services/groups";
import type { Session, SessionStatus, UserRole } from "../types/groups";

const STATUS_BADGE: Record<SessionStatus, { label: string; className: string }> = {
  open:    { label: 'Open',               className: 'bg-primary/10 text-primary border border-primary/20' },
  voting:  { label: 'Voting in Progress', className: 'bg-primary/10 text-primary border border-primary/20' },
  decided: { label: 'Decided',            className: 'bg-secondary-container text-on-secondary-container border border-outline-variant' },
  closed:  { label: 'Archive',            className: 'bg-surface-variant text-on-surface-variant' },
};

const STATUS_ICON: Record<SessionStatus, string> = {
  open:    'movie',
  voting:  'how_to_vote',
  decided: 'check_circle',
  closed:  'history',
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
    <div className="bg-surface-container-high rounded-xl p-md border border-outline-variant cinematic-glow">
      <div className="flex items-center justify-between mb-lg">
        <h3 className="type-headline-sm text-on-surface">Sessions</h3>
        {canManage && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg type-label-md flex items-center gap-2 hover:brightness-110 transition-all active:scale-95 shadow-[0_0_15px_rgba(0,230,118,0.3)]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            New Session
          </button>
        )}
      </div>

      {/* New session form */}
      {showForm && (
        <div className="mb-md p-md bg-surface-container rounded-xl border border-outline-variant flex flex-col gap-sm">
          <p className="type-label-md text-on-surface-variant uppercase tracking-wider">Schedule (optional)</p>
          <input
            type="datetime-local"
            className="bg-background border border-outline-variant rounded-lg px-4 py-2 type-body-md text-on-surface focus:border-primary focus:outline-none transition-colors"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
          />
          {error && <p className="type-label-sm text-error">{error}</p>}
          <div className="flex gap-sm pt-xs">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="bg-primary text-on-primary px-6 py-2 rounded-lg type-label-md hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(''); }}
              className="px-6 py-2 rounded-lg type-label-md text-on-surface-variant bg-surface-variant hover:bg-surface-container-highest transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {sessions.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-xl text-on-surface-variant gap-2">
          <span className="material-symbols-outlined opacity-30" style={{ fontSize: '48px' }}>movie</span>
          <p className="type-label-md">No sessions yet.</p>
        </div>
      )}

      <div className="space-y-sm">
        {sessions.map((s, i) => {
          const badge = STATUS_BADGE[s.status];
          const icon = STATUS_ICON[s.status];
          const isArchived = s.status === 'closed';
          const dateLabel = s.scheduled_for
            ? new Date(s.scheduled_for).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
            : `Created ${new Date(s.created_at).toLocaleDateString()}`;

          return (
            <div
              key={s.id}
              onClick={() => navigate(`/group/${groupId}/session/${s.id}`)}
              className={`group flex flex-col md:flex-row items-center gap-md p-md bg-surface-container rounded-xl border border-transparent hover:border-primary/30 transition-all cursor-pointer ${isArchived ? 'opacity-60 hover:opacity-100' : ''}`}
            >
              {/* Thumbnail */}
              <div className={`relative w-full md:w-32 h-20 bg-surface-container-low rounded-lg overflow-hidden shrink-0 border border-outline-variant flex items-center justify-center ${isArchived ? 'grayscale group-hover:grayscale-0 transition-all' : ''}`}>
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '36px' }}>{icon}</span>
              </div>

              {/* Info */}
              <div className="flex-1 w-full text-center md:text-left">
                <h4 className={`type-headline-sm ${isArchived ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                  Session #{sessions.length - i}
                </h4>
                <p className="type-label-md text-on-surface-variant">{dateLabel}</p>
              </div>

              {/* Status + arrow */}
              <div className="flex items-center gap-lg w-full md:w-auto justify-center md:justify-end">
                <span className={`px-3 py-1 rounded-full type-label-sm uppercase ${badge.className}`}>
                  {badge.label}
                </span>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                  {isArchived ? 'history' : 'arrow_forward'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
