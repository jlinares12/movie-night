import { useState } from "react";
import { joinGroup } from "../services/groups";
import FilledButton from "./buttons/FilledButton";

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
        placeholder="xxxxxxxx"
        maxLength={8}
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9_-]/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={loading}
      />
      {error && <p className="type-label-md text-error -mt-2">{error}</p>}
      <FilledButton size="lg" label={loading ? 'Joining…' : 'Join Group'} isDisabled={loading} onClick={handleSubmit} />
    </div>
  );
}
