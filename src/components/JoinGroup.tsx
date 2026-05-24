import { useState } from "react";
import FilledButton from "./buttons/FilledButton";
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
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          required
          className="w-full border border-[var(--primary-gray)] rounded-[10px] p-4 text-sm bg-transparent focus:border-[var(--primary-color)] focus:outline-none"
          placeholder="Enter a group code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={loading}
        />
        <FilledButton label="Join" onClick={handleSubmit} isDisabled={loading} />
      </div>
      {error && <p className="type-label-md text-red-400 pl-1">{error}</p>}
    </div>
  );
}
