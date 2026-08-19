import ComingSoon from "../components/ComingSoon";

export default function HelpPage() {
  return (
    <ComingSoon
      icon="help"
      title="The Help Booth"
      description="Walkthroughs for groups, sessions, and voting, answers to the questions everyone asks first, and a direct line to us when something isn't playing right."
      progressLabel="Writing the manual"
      progress={30}
    />
  );
}
