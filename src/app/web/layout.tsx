import type { Metadata } from "next";
import { APP_NAME, WEB_APP_NAME, joinTitleParts } from "@/lib/brand";
import PWARegistration from "./pwa-registration";

const WEB_PAGE_TITLE = joinTitleParts(
  WEB_APP_NAME,
  'A4 PDF to 4x6" Shipping Label Cropper',
  APP_NAME,
);

export const metadata: Metadata = {
  metadataBase: new URL("https://croplet.app"),
  alternates: {
    canonical: "/web",
  },
  title: WEB_PAGE_TITLE,
  description:
    `${WEB_APP_NAME} brings shipping-label cropping to desktop browsers and installable PWA homescreens.`,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  openGraph: {
    title: 'A4 PDF to 4x6" Shipping Label Cropper',
    description:
      `A desktop-first and PWA-ready ${APP_NAME} experience for converting A4 labels into 4×6 outputs.`,
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
