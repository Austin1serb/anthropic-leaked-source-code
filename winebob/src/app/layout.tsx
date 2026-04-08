import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/AuthProvider";
import { UniversePortal } from "@/components/shared/UniversePortal";
import { SearchProvider } from "@/components/shared/SearchContext";
import { SmartSearchOverlay } from "@/components/shared/SmartSearchOverlay";
import "./globals.css";

export const metadata: Metadata = {
  title: "Winebob",
  description:
    "Blind tasting made social. Join an event or host your own.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Winebob",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FEF9F0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <SearchProvider>
            {children}
            <SmartSearchOverlay />
          </SearchProvider>
          <UniversePortal />
        </AuthProvider>
      </body>
    </html>
  );
}
