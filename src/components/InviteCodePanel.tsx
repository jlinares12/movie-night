import { useState } from "react";
import { regenerateInvite } from "../services/groups";
import { ApiError } from "../services/apiError";
import OutlinedButton from "./buttons/OutlinedButton";
import IconButton from "./buttons/IconButton";
import { Skeleton, SkeletonGroup } from "./Skeleton";
import type { UserRole } from "../types/groups";

/**
 * Layout only — the real panel and its skeleton must occupy identical space, so these
 * classes are shared rather than duplicated. `justify-between` matters to both: the panel
 * is stretched by its taller bento-grid sibling, and the actions must sit at the bottom
 * of that stretched box in either state.
 */
const PANEL =
  'bg-surface-container-high rounded-xl p-md border border-outline-variant ' +
  'cinematic-glow flex flex-col justify-between h-full';

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
    <div className={PANEL}>
      <div>
        <div className="flex items-center justify-between mb-lg">
          <h3 className="type-headline-sm text-on-surface">Invite Code</h3>
          <span className="material-symbols-outlined text-primary">share</span>
        </div>

        <div className="flex flex-col items-center justify-center py-lg bg-background rounded-lg border border-dashed border-outline-variant">
          {/*
           * `overflow-wrap: anywhere`, not `break-words`: the code is one unbreakable
           * run, and only `anywhere` affects intrinsic sizing — which is what sets this
           * column's width. Today's code is 8 chars (`secrets.token_urlsafe(6)`) and
           * fits 375px; this is what keeps a longer one from overflowing the document.
           */}
          <span className="type-display-lg-mobile text-primary tracking-widest font-mono select-all [overflow-wrap:anywhere]">
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

/**
 * Mirrors the panel above, region for region, and is its own `SkeletonGroup` so the sweep
 * is clipped to the panel's rounded corners.
 *
 * The regenerate icon button is deliberately absent: it is gated on `your_role`, which is
 * exactly what the in-flight request is fetching. A skeleton that guesses a permission is
 * wrong half the time; one that omits the control only ever settles by *adding* a 44px
 * affordance next to a flex-1 button, which reads as the page filling in rather than
 * rearranging. 44px is `IconButton`'s `min-w-11` floor, level with the `h-11` copy button
 * beside it, so the row's height is unchanged either way.
 */
export function InviteCodePanelSkeleton() {
  return (
    <SkeletonGroup label="Loading invite code" className={PANEL}>
      <div>
        {/* Title + share icon — type-headline-sm (1.25rem × 1.35 ≈ 27px) beside a 24px icon */}
        <div className="flex items-center justify-between mb-lg">
          <Skeleton className="h-7 w-40" />
          <Skeleton variant="circle" className="w-6" />
        </div>

        {/* Code plaque — py-lg ×2 (96) + display-lg-mobile (38) + mt-2 (8) + label-sm (17) */}
        <Skeleton variant="rect" className="h-[159px] rounded-lg" />
      </div>

      {/* Copy button — px-6 py-3 ×2 + type-label-md + border ≈ 44px */}
      <div className="mt-lg flex gap-sm">
        <Skeleton variant="rect" className="h-11 flex-1 rounded-xl" />
      </div>
    </SkeletonGroup>
  );
}
