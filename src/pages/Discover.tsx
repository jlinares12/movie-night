import ComingSoon from "../components/ComingSoon";

export default function DiscoverPage() {
  return (
    <ComingSoon
      icon="explore"
      title="Find Your Next Feature"
      description="A browsable catalog of trending films, deep genre cuts, and picks we think you might like."
      progressLabel="Scouting titles"
      progress={45}
    />
  );
}
