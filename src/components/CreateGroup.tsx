import { useState } from "react";
import { createGroup } from "../services/groups";

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
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-primary-container text-on-primary-container type-headline-sm py-4 rounded-xl shadow-[0_0_20px_rgba(0,230,118,0.2)] hover:shadow-[0_0_30px_rgba(0,230,118,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Create Group
      </button>
    </div>
  );
}
