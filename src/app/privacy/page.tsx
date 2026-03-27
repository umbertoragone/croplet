import type { Metadata } from "next";
import Header from "@/components/Header";
import { APP_STORE_URL } from "@/lib/app-store";

export const metadata: Metadata = {
  title: "Privacy Policy — Croplet",
  description:
    "Croplet is designed to process shipping labels on your device. Learn what the app handles, what stays local, and when data may be shared.",
};

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(27,107,99,0.18), transparent 32%), linear-gradient(180deg, #eef6f3 0%, #f4f7f4 100%)",
        lineHeight: "1.6",
      }}
    >
      <Header currentPath="/privacy" appStoreUrl={APP_STORE_URL} />

      <main
        className="mx-auto my-12 p-8"
        style={{
          width: "min(860px, calc(100% - 32px))",
          background: "rgba(255,255,255,0.88)",
          border: "1px solid rgba(22,48,43,0.1)",
          borderRadius: "28px",
          boxShadow: "0 18px 50px rgba(13,42,38,0.12)",
          backdropFilter: "blur(10px)",
        }}
      >
        <span
          className="inline-block mb-3 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
          style={{ background: "rgba(27,107,99,0.1)", color: "#1b6b63" }}
        >
          Croplet
        </span>
        <h1
          className="font-bold mb-3"
          style={{ fontSize: "clamp(2.2rem, 4vw, 3.4rem)", color: "#16302b", lineHeight: 1.15 }}
        >
          Privacy Policy
        </h1>
        <p className="mb-4" style={{ fontSize: "1.05rem", maxWidth: "64ch", color: "#56716a" }}>
          Effective date: March 13, 2026.
        </p>
        <p style={{ color: "#56716a" }}>
          Croplet is designed to process shipping labels on your device. This
          policy explains what the app handles, what stays local, and when data
          may be shared with Apple or with us.
        </p>

        <div
          className="grid gap-3.5 my-7"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
        >
          {[
            {
              title: "On-device processing",
              body: "Imported PDF labels, image rendering, barcode detection, and OCR are processed locally on your device.",
            },
            {
              title: "Local settings",
              body: "Your preferences, such as export format and label defaults, are stored locally on your device.",
            },
            {
              title: "Purchases",
              body: "Croplet Pro purchases and entitlement checks are handled by Apple through the App Store and StoreKit.",
            },
          ].map((card) => (
            <section
              key={card.title}
              className="p-4 rounded-[20px]"
              style={{
                background: "rgba(255,255,255,0.72)",
                border: "1px solid rgba(22,48,43,0.1)",
              }}
            >
              <strong className="block mb-1.5 text-[#16302b] text-[0.95rem]">
                {card.title}
              </strong>
              <p className="text-sm" style={{ color: "#56716a" }}>{card.body}</p>
            </section>
          ))}
        </div>

        <h2
          className="font-bold mt-7 mb-3"
          style={{ fontSize: "1.15rem", color: "#16302b", lineHeight: 1.15 }}
        >
          Information Croplet processes
        </h2>
        <ul className="pl-5" style={{ color: "#56716a" }}>
          <li>PDF files and their contents when you import a shipping label into the app.</li>
          <li>Recognized text and barcode data needed to detect and crop the label.</li>
          <li>App settings you choose, such as export format, DPI, and label preferences.</li>
          <li>Purchase and entitlement status returned by Apple if you buy or restore Croplet Pro.</li>
          <li>Information you choose to include if you contact support, report a bug, or request a feature by email.</li>
        </ul>

        <h2
          className="font-bold mt-7 mb-3"
          style={{ fontSize: "1.15rem", color: "#16302b", lineHeight: 1.15 }}
        >
          How information is used
        </h2>
        <ul className="pl-5" style={{ color: "#56716a" }}>
          <li>To crop, optimize, preview, and export shipping labels inside the app.</li>
          <li>To remember your preferences between sessions on your device.</li>
          <li>To unlock and restore paid features through Apple&apos;s billing systems.</li>
          <li>To respond to support requests, bug reports, or feature requests that you send by email.</li>
        </ul>

        <h2
          className="font-bold mt-7 mb-3"
          style={{ fontSize: "1.15rem", color: "#16302b", lineHeight: 1.15 }}
        >
          What Croplet does not do
        </h2>
        <ul className="pl-5" style={{ color: "#56716a" }}>
          <li>Croplet does not send your imported shipping labels to a Croplet-operated server for processing.</li>
          <li>Croplet does not require an account.</li>
          <li>Croplet does not show third-party advertising.</li>
        </ul>

        <h2
          className="font-bold mt-7 mb-3"
          style={{ fontSize: "1.15rem", color: "#16302b", lineHeight: 1.15 }}
        >
          Third parties
        </h2>
        <p style={{ color: "#56716a" }}>
          Apple processes in-app purchases, subscription management, transaction
          verification, and related App Store services under Apple&apos;s own terms
          and privacy policies. If you use the email actions inside Croplet,
          your mail provider will also process the email you send.
        </p>

        <h2
          className="font-bold mt-7 mb-3"
          style={{ fontSize: "1.15rem", color: "#16302b", lineHeight: 1.15 }}
        >
          Data retention
        </h2>
        <p style={{ color: "#56716a" }}>
          Imported documents and exported files remain under your control on
          your device and in locations you choose to save or share them. Support
          emails are retained for as long as reasonably necessary to respond,
          troubleshoot issues, and keep a record of product feedback.
        </p>

        <h2
          className="font-bold mt-7 mb-3"
          style={{ fontSize: "1.15rem", color: "#16302b", lineHeight: 1.15 }}
        >
          Your choices
        </h2>
        <ul className="pl-5" style={{ color: "#56716a" }}>
          <li>You can remove app data by deleting the app and its local documents from your device.</li>
          <li>You can manage or cancel subscriptions through your Apple account settings.</li>
          <li>You can decide what information to include before sending an email from the app.</li>
        </ul>

        <h2
          className="font-bold mt-7 mb-3"
          style={{ fontSize: "1.15rem", color: "#16302b", lineHeight: 1.15 }}
        >
          Contact
        </h2>
        <p style={{ color: "#56716a" }}>
          For privacy questions about Croplet, contact:
        </p>
        <ul className="pl-5" style={{ color: "#56716a" }}>
          <li>Name: Umberto Ragone</li>
          <li>
            Email:{" "}
            <a href="mailto:umberto@ragone.dev" style={{ color: "#1b6b63" }}>
              umberto@ragone.dev
            </a>
          </li>
        </ul>

        <footer
          className="mt-9 pt-5 text-[0.95rem]"
          style={{
            borderTop: "1px solid rgba(22,48,43,0.1)",
            color: "#56716a",
          }}
        >
          This policy may be updated when Croplet&apos;s data practices change. The
          effective date above will be updated when a new version of this policy
          is published.
        </footer>
      </main>
    </div>
  );
}
