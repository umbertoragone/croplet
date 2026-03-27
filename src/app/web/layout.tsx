import type { Metadata } from "next";
import PWARegistration from "./pwa-registration";

export const metadata: Metadata = {
  metadataBase: new URL("https://web.croplet.app"),
  title: "Web App",
  description:
    "Croplet Web brings shipping-label cropping to desktop browsers and installable PWA homescreens.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Croplet",
  },
  openGraph: {
    title: "Croplet Web",
    description:
      "A desktop-first and PWA-ready Croplet experience for converting A4 labels into 4×6 outputs.",
    images: ["/icon.png"],
  },
};

export default function WebLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <PWARegistration />
      {children}
    </>
  );
}
