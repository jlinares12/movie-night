import { useState } from "react";
import { joinGroup } from "../services/groups";

interface Props {
  onJoined: () => void;
}

export default function JoinGroup({ onJoined }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Invite code is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await joinGroup(trimmed);
      setCode('');
      onJoined();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) setError('Invalid invite code.');
      else if (status === 409) setError("You're already a member of this group.");
      else setError(err?.response?.data?.error ?? 'Could not join group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        required
        className="w-full bg-surface py-4 px-6 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface placeholder:text-on-surface-variant/40 text-center tracking-[0.5em] font-bold"
        placeholder="######"
        maxLength={6}
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={loading}
      />
      {error && <p className="type-label-md text-error -mt-2">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-primary-container text-on-primary-container type-headline-sm py-4 rounded-xl shadow-[0_0_20px_rgba(0,230,118,0.2)] hover:shadow-[0_0_30px_rgba(0,230,118,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Join Session
      </button>
    </div>
  );
}
