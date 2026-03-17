import { SettingsShell } from "@/features/settings/components/SettingsShell";

export const metadata = {
  title: "Settings",
  description: "Configure your Yield Flow experience, and customize your preferences.",
  alternates: {
    canonical: '/settings',
  },
  // Note: We set index to false for the settings page to prevent it from being indexed by search engines,
  // as it's a user-specific page that doesn't provide value to the general public.
  robots: {
    index: false,
    follow: true,
  },
};

export default function SettingsPage() {
  return <SettingsShell />;
}
