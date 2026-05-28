import { useState } from "react";
import { regenerateInvite } from "../services/groups";
import { ApiError } from "../services/apiError";
import OutlinedButton from "./buttons/OutlinedButton";
import IconButton from "./buttons/IconButton";
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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not regenerate code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-high rounded-xl p-md border border-outline-variant cinematic-glow flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-lg">
          <h3 className="type-headline-sm text-on-surface">Invite Code</h3>
          <span className="material-symbols-outlined text-primary">share</span>
        </div>

        <div className="flex flex-col items-center justify-center py-lg bg-background rounded-lg border border-dashed border-outline-variant">
          <span className="type-display-lg-mobile text-primary tracking-widest font-mono select-all">
            {invite_code}
          </span>
          <p className="type-label-sm text-on-surface-variant mt-2 uppercase tracking-tighter">
            Share with friends to invite them
          </p>
        </div>
      </div>

      {error && <p className="type-label-sm text-error mt-sm">{error}</p>}

      <div className="mt-lg flex gap-sm">
        <div className="flex-1">
          <OutlinedButton icon={copied ? 'check' : 'content_copy'} label={copied ? 'Copied!' : 'Copy Code'} onClick={handleCopy} />
        </div>
        {canRegenerate && (
          <IconButton icon="refresh" title="Regenerate code" loading={loading} isDisabled={loading} onClick={handleRegenerate} size={18} />
        )}
      </div>
    </div>
  );
}
