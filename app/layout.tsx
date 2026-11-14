import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Katha & Kahini | Illustrated Indian epics",
  description: "Watch the Chakravyuh series and Chhath Puja. Illustrated Indian epics and festival stories, narrated in Hindi.",
  icons: { icon: "/assets/logo.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

