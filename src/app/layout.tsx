import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://croplet.app"),
  title: "Croplet — A4 to 4×6″ Label Cropper",
  description:
    "Croplet is the iOS app that automatically crops A4 shipping label PDFs to 4×6″, ready for thermal printing. Supports Poste Italiane, BRT, InPost, UPS, DHL, and more.",
  openGraph: {
    title: "Croplet — A4 to 4×6″ Label Cropper",
    description:
      "Automatically crop A4 shipping label PDFs to 4×6″ for thermal printing. On-device OCR, multi-carrier support, export to PDF or PNG.",
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
