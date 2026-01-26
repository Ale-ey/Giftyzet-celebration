import type { Metadata } from "next";
import OverviewPage from "@/components/overview/OverviewPage";

export const metadata: Metadata = {
  title: "How to Use GiftyZel - Overview",
  description: "Learn how to send gifts and register as a vendor on GiftyZel",
  icons: {
    icon: "/logo.png",
  },
};

export default function Overview() {
  return <OverviewPage />;
}
