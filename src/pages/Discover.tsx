import ComingSoon from "../components/ComingSoon";

export default function DiscoverPage() {
  return (
    <ComingSoon
      icon="explore"
      title="Find Your Next Feature"
      description="A browsable catalog of trending films, deep genre cuts, and picks tuned to what your groups already watch — so you can nominate without ever leaving Call Time."
      progressLabel="Scouting titles"
      progress={45}
    />
  );
}
