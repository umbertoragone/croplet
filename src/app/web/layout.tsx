import type { Metadata } from "next";
import PWARegistration from "./pwa-registration";

export const metadata: Metadata = {
  metadataBase: new URL("https://croplet.app"),
  alternates: {
    canonical: "/web",
  },
  title: "Croplet Web – A4 PDF to 4x6 Shipping Label Cropper",
  description:
    "Croplet Web brings shipping-label cropping to desktop browsers and installable PWA homescreens.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Croplet",
  },
  openGraph: {
    title: "A4 PDF to 4x6 Shipping Label Cropper",
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
