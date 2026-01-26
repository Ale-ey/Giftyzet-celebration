import type { Metadata } from "next";
import ProfilePage from "@/components/profile/ProfilePage";

export const metadata: Metadata = {
  title: "My Profile - Account Settings | GiftyZel",
  description:
    "Manage your account settings, shipping addresses, and preferences.",
  icons: {
    icon: "/logo.png",
  },
};

export default function Profile() {
  return <ProfilePage />;
}
