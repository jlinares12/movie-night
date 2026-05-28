import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSession, updateSession, deleteSession, getGroup } from "../services/groups";
import { ApiError } from "../services/apiError";
import { useGroupEvents } from "../hooks/useGroupEvents";
import type { Session, UserRole, SessionStatus, GroupDetail } from "../types/groups";

const NEXT_STATUS: Record<SessionStatus, SessionStatus | null> = {
  open: 'voting',
  voting: 'decided',
  decided: 'closed',
  closed: null,
};

const STATUS_CONFIG: Record<SessionStatus, { badge: string; icon: string; description: string }> = {
  open:    { badge: 'OPEN FOR NOMINATIONS', icon: 'movie',        description: 'Members can nominate their favorite movies for this session.' },
  voting:  { badge: 'VOTING IN PROGRESS',   icon: 'how_to_vote', description: 'The group is casting votes. May the best film win!' },
  decided: { badge: 'WINNER SELECTED',      icon: 'stars',       description: 'The votes are in! The group has chosen their movie for the night.' },
  closed:  { badge: 'SESSION CLOSED',       icon: 'event_busy',  description: 'This movie night session has wrapped up.' },
};

const AVATAR_COLORS = [
  'bg-primary/20 text-primary',
  'bg-tertiary/20 text-tertiary',
  'bg-secondary/20 text-secondary',
];

interface PotluckItem { name: string; item: string; }

export default function SessionPage() {
  const { id, sessionId } = useParams<{ id: string; sessionId: string }>();
  const navigate = useNavigate();

  const [session,   setSession]   = useState<Session | null>(null);
  const [group,     setGroup]     = useState<GroupDetail | null>(null);
  const [yourRole,  setYourRole]  = useState<UserRole | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [advancing, setAdvancing] = useState(false);

  const [potluckItems, setPotluckItems] = useState<PotluckItem[]>([]);
  const [potluckInput, setPotluckInput] = useState('');

  const groupId = id        ? parseInt(id, 10)        : null;
  const sesId   = sessionId ? parseInt(sessionId, 10) : null;

  useEffect(() => {
    if (!groupId || !sesId) return;
    Promise.all([getSession(groupId, sesId), getGroup(groupId)])
      .then(([sesRes, grpRes]) => {
        setSession(sesRes.data);
        setGroup(grpRes.data);
        setYourRole(grpRes.data.your_role);
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof ApiError) {
          if (err.status === 403)      setError('Access denied.');
          else if (err.status === 404) setError('Session not found.');
          else                         setError(err.message);
        } else {
          setError('Failed to load session.');
        }
        setLoading(false);
      });
  }, [groupId, sesId]);

  useGroupEvents(groupId ?? 0, {
    onSessionUpdated: (data) => {
      if (data.session_id === sesId)
        setSession((s) => s ? { ...s, status: data.status as SessionStatus, scheduled_for: data.scheduled_for } : s);
    },
    onSessionDeleted: (data) => { if (data.session_id === sesId) navigate(`/group/${groupId}`); },
    onGroupDeleted:   ()     => navigate('/'),
  });

  const handleAdvance = async () => {
    if (!nextStatus || !groupId || !sesId) return;
    setAdvancing(true);
    try {
      const res = await updateSession(groupId, sesId, { status: nextStatus });
      setSession(res.data);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not advance status.');
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
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not delete session.');
    }
  };

  const addPotluckItem = () => {
    if (!potluckInput.trim()) return;
    setPotluckItems((prev) => [...prev, { name: 'You', item: potluckInput.trim() }]);
    setPotluckInput('');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <span className="text-label-md text-primary animate-pulse">Loading session…</span>
    </div>
  );
  if (error || !session) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <span className="text-label-md text-error">{error || 'Unknown error.'}</span>
    </div>
  );

  const canManage  = yourRole === 'owner' || yourRole === 'admin';
  const nextStatus = NEXT_STATUS[session.status as SessionStatus];
  const cfg        = STATUS_CONFIG[session.status as SessionStatus];

  const scheduledDate = session.scheduled_for ? new Date(session.scheduled_for) : null;
  const formattedDate = scheduledDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const formattedTime = scheduledDate?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="flex flex-col gap-xl">
      {/* Back */}
      <button
        onClick={() => navigate(`/group/${groupId}`)}
        className="self-start flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
        Back to group
      </button>

      {/* ── Hero ── */}
      <section className="relative rounded-[32px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-[440px] bg-gradient-to-br from-surface-container-high via-surface-container to-surface-dim" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-transparent" />
          <div className="absolute -top-16 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 p-lg flex flex-col justify-end h-[440px]">
          <div className="max-w-2xl">
            <div className="flex items-center gap-sm mb-sm">
              <span
                className="inline-flex items-center gap-xs bg-primary/20 text-primary px-sm py-xs rounded-full text-label-sm border border-primary/30 neon-glow"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                >
                  {cfg.icon}
                </span>
                {cfg.badge}
              </span>
              <span className="text-on-surface-variant text-label-md">• Movie Night</span>
            </div>

            <h1 className="font-display text-display-lg text-on-surface mb-xs">
              Movie Night Session
            </h1>
            <p className="text-body-lg text-on-surface-variant mb-md leading-relaxed">{cfg.description}</p>

            <div className="flex flex-wrap items-center gap-md">
              {scheduledDate ? (
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  <span className="text-headline-sm">{formattedDate} • {formattedTime}</span>
                </div>
              ) : (
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-on-surface-variant">schedule</span>
                  <span className="text-headline-sm text-on-surface-variant">No date scheduled</span>
                </div>
              )}

              {group && (
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary">group</span>
                  <span className="text-headline-sm">{group.name}</span>
                </div>
              )}

              {canManage && nextStatus && (
                <button
                  onClick={handleAdvance}
                  disabled={advancing}
                  className="ml-auto bg-primary text-on-primary font-bold px-lg py-sm rounded-xl flex items-center gap-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 neon-glow"
                >
                  <span className="material-symbols-outlined">play_circle</span>
                  {advancing ? 'Advancing…' : `Advance to ${nextStatus}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-12 gap-lg">

        {/* Left column: nominations */}
        <div className="col-span-12 lg:col-span-8 space-y-md">
          <div className="flex justify-between items-end">
            <h3 className="text-headline-md text-on-surface">
              {session.status === 'decided' || session.status === 'closed'
                ? 'Final Ballot Results'
                : 'Nominations'}
            </h3>
            <p className="text-label-sm text-on-surface-variant">
              {group?.members?.length ?? 0} Members
            </p>
          </div>

          {session.status === 'open' && (
            <div className="border-2 border-dashed border-outline-variant/40 rounded-[24px] p-lg flex flex-col items-center justify-center gap-sm text-center min-h-[200px]">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '48px' }}>movie_filter</span>
              <p className="text-headline-sm text-on-surface-variant">No nominations yet</p>
              <p className="text-body-md text-on-surface-variant/70">Members can start adding their movie picks.</p>
            </div>
          )}

          {session.status === 'voting' && (
            <div className="border-2 border-dashed border-primary/30 rounded-[24px] p-lg flex flex-col items-center justify-center gap-sm text-center min-h-[200px] neon-glow">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '48px' }}>how_to_vote</span>
              <p className="text-headline-sm text-primary">Voting in Progress</p>
              <p className="text-body-md text-on-surface-variant">Members are casting their votes.</p>
            </div>
          )}

          {(session.status === 'decided' || session.status === 'closed') && (
            <div className="border-2 border-dashed border-outline-variant/40 rounded-[24px] p-lg flex flex-col items-center justify-center gap-sm text-center min-h-[200px]">
              <span
                className="material-symbols-outlined text-on-surface-variant"
                style={{ fontSize: '48px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                check_circle
              </span>
              <p className="text-headline-sm text-on-surface-variant capitalize">Session {session.status}</p>
              <p className="text-body-md text-on-surface-variant/70">Results will appear here once nominations are added.</p>
            </div>
          )}

          {/* Session meta */}
          <div className="bg-surface-container border border-outline-variant/20 rounded-[24px] p-md">
            <div className="grid grid-cols-2 gap-md">
              <div>
                <p className="text-label-sm text-on-surface-variant mb-xs">Created</p>
                <p className="text-label-md text-on-surface">
                  {new Date(session.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant mb-xs">Status</p>
                <p className="text-label-md text-primary capitalize">{session.status}</p>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          {canManage && (
            <div className="bg-surface-container border border-error-container/30 rounded-[24px] p-md flex items-center gap-md flex-wrap">
              <div>
                <p className="text-label-md text-on-surface">Danger Zone</p>
                <p className="text-label-sm text-on-surface-variant">Permanently remove this session and all its data.</p>
              </div>
              <button
                onClick={handleDelete}
                className="ml-auto bg-error-container text-on-error-container font-bold px-md py-sm rounded-xl text-label-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-xs"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                Delete Session
              </button>
            </div>
          )}
        </div>

        {/* Right column: potluck */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface-container-high rounded-[32px] p-lg border border-outline-variant/20 sticky top-6">
            <div className="flex items-center gap-sm mb-md">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '30px' }}>restaurant</span>
              <h3 className="text-headline-md text-on-surface">Who's Bringing What?</h3>
            </div>

            <ul className="space-y-sm mb-lg">
              {potluckItems.length === 0 ? (
                <li className="text-center py-md text-body-md text-on-surface-variant">
                  No contributions yet. Add yours!
                </li>
              ) : (
                potluckItems.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between p-sm bg-surface-container-lowest rounded-xl border border-outline-variant/10"
                  >
                    <div className="flex items-center gap-sm">
                      <div
                        className={`w-8 h-8 rounded-full ${AVATAR_COLORS[i % 3]} flex items-center justify-center font-bold text-xs`}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-label-md text-on-surface">{p.name}</span>
                    </div>
                    <span className="text-body-md text-on-surface-variant">{p.item}</span>
                  </li>
                ))
              )}
            </ul>

            <div className="mt-md pt-md border-t border-outline-variant/30">
              <label className="block text-label-sm text-on-surface-variant mb-xs">
                Add your contribution
              </label>
              <div className="flex gap-xs">
                <input
                  value={potluckInput}
                  onChange={(e) => setPotluckInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPotluckItem()}
                  className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-md py-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface text-body-md"
                  placeholder="I'll bring something..."
                />
                <button
                  onClick={addPotluckItem}
                  className="bg-primary-container p-sm rounded-xl text-on-primary-container flex items-center justify-center hover:scale-110 active:scale-90 transition-transform shadow-lg"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
