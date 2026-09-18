import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Toaster } from "sonner";
import MobileBottomNav from "@/components/MobileBottomNav";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "Saiful Store",
  description: "Saiful Store Customer Credit Management",
  manifest: "/manifest.webmanifest",
  //icons: {
    //icon: "/icon-192.png",
    //apple: "/icon-192.png",
  //},
};

export const viewport: Viewport = {
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body>
        {children}

        <MobileBottomNav />

        <InstallPrompt />

        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={3000}
        />
      </body>
    </html>
  );
}