import { useState } from "react";
import FilledButton from "./buttons/FilledButton";
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
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          required
          className="w-full border border-[var(--primary-gray)] rounded-[10px] p-4 text-sm bg-transparent focus:border-[var(--primary-color)] focus:outline-none"
          placeholder="Enter a name for your group"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={loading}
        />
        <FilledButton label="Create" onClick={handleSubmit} isDisabled={loading} />
      </div>
      {error && <p className="text-red-400 text-sm pl-1">{error}</p>}
    </div>
  );
}
