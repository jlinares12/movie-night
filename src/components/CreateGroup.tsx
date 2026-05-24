import { useState } from "react";
import { createGroup } from "../services/groups";
import FilledButton from "./buttons/FilledButton";

interface Props {
  onCreated: () => void;
}

export default function CreateGroup({ onCreated }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Group name is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await createGroup(trimmed);
      setName('');
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not create group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        required
        className="w-full bg-surface py-4 px-6 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface placeholder:text-on-surface-variant/40"
        placeholder="Group Name (e.g., Horror Enthusiasts)"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={loading}
      />
      {error && <p className="type-label-md text-error -mt-2">{error}</p>}
      <FilledButton size="lg" label={loading ? 'Creating…' : 'Create Group'} isDisabled={loading} onClick={handleSubmit} />
    </div>
  );
}
