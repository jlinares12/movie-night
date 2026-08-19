import ComingSoon from "../components/ComingSoon";

/* Account management lives in the Settings tab (`src/pages/Settings.tsx`);
 * this page is reserved for the public-facing side of a member. */
export default function ProfilePage() {
  return (
    <ComingSoon
      icon="person"
      title="Your Cinematic Legacy"
      description="A personal space for your watch history, the movies you've nominated, and the stats behind every session your groups have run."
      progressLabel="Rendering profile"
      progress={85}
    />
  );
}
