import { UserProfile } from "@clerk/clerk-react";
import { userProfileAppearance } from "../utils/clerkAppearance";

export default function SettingsPage() {
  return (
    <>
      {/* Fixed atmospheric background blurs */}
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-0 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Page header */}
      <header className="mb-xl relative">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <h2 className="type-display-lg mb-2">Settings</h2>
        <p className="type-body-lg text-on-surface-variant max-w-2xl">
          Manage your account, security, and how you show up to the rest of your movie groups.
        </p>
      </header>

      <section className="max-w-4xl">
        <UserProfile appearance={userProfileAppearance} />
      </section>
    </>
  );
}
