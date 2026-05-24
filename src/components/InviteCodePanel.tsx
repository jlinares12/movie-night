import { useState } from "react";
import FilledButton from "./buttons/FilledButton";
import OutlinedButton from "./buttons/OutlinedButton";
import { regenerateInvite } from "../services/groups";
import type { UserRole } from "../types/groups";

interface Props {
  groupId: number;
  invite_code: string;
  your_role: UserRole;
  onCodeChanged: (newCode: string) => void;
}

export default function InviteCodePanel({ groupId, invite_code, your_role, onCodeChanged }: Props) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canRegenerate = your_role === 'owner' || your_role === 'admin';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Clipboard access denied.');
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Regenerate invite code? The current code will stop working.')) return;
    setError('');
    setLoading(true);
    try {
      const res = await regenerateInvite(groupId);
      onCodeChanged(res.data.invite_code);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not regenerate code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="type-label-md text-[var(--member-color)]">Invite Code</p>
      <div className="flex items-center gap-3">
        <code className="font-mono bg-[var(--bk-color)] border border-[var(--primary-gray)] rounded-[8px] px-4 py-2 text-[var(--primary-color)] tracking-widest text-lg select-all">
          {invite_code}
        </code>
        <OutlinedButton label={copied ? 'Copied!' : 'Copy'} onClick={handleCopy} />
        {canRegenerate && (
          <FilledButton label="Regenerate" onClick={handleRegenerate} isDisabled={loading} />
        )}
      </div>
      {error && <p className="type-label-md text-red-400">{error}</p>}
    </div>
  );
}
