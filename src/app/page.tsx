import Image from "next/image";
import Link from "next/link";
import PhoneFrame from "./components/PhoneFrame";
import {
  ScanText,
  Truck,
  Printer,
  FolderInput,
  SlidersHorizontal,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const APP_STORE_URL =
  "https://apps.apple.com/us/app/croplet/id6760548549?itscg=30200&itsct=apps_box_link&mttnsubad=6760548549";

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: ScanText,
    title: "On-device OCR",
    description:
      "Auto-detects and crops labels using OCR — no data ever leaves your device.",
  },
  {
    icon: Truck,
    title: "Multi-carrier support",
    description:
      "Works with Poste Italiane, BRT, DPD, InPost, Mondial Relay, Hermes, UPS, DHL, and more.",
  },
  {
    icon: Printer,
    title: "Thermal-print ready",
    description:
      "Export cropped labels as 4×6″ PDF or PNG at 203 or 300 DPI — perfect for Zebra and similar thermal printers.",
  },
  {
    icon: FolderInput,
    title: "Flexible import",
    description:
      "Open PDFs from Files, share them directly from any app, including Vinted, or paste a URL to download and process instantly.",
  },
  {
    icon: SlidersHorizontal,
    title: "Manual & automatic modes",
    description:
      "Use auto-crop for speed or fine-tune with manual mode — you're always in control.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy first",
    description:
      "All processing happens locally. No account required, no external servers, no ads, no tracking.",
  },
];

export default function Home() {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(27,107,99,0.15), transparent 40%), linear-gradient(180deg, #eef6f3 0%, #f4f7f4 100%)",
      }}
    >
      {/* Nav */}
      <header className="w-full px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Image
            src="/icon.png"
            alt="Croplet icon"
            width={36}
            height={36}
            className="rounded-xl"
          />
          <span className="font-semibold text-[#16302b] tracking-tight">
            Croplet
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-[#56716a]">
          <Link
            href="/privacy"
            className="hover:text-[#1b6b63] transition-colors"
          >
            Privacy
          </Link>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-opacity hover:opacity-80"
          >
            <Image
              src="/black.svg"
              alt="Download on the App Store"
              width={120}
              height={40}
            />
          </a>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <span
              className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{
                background: "rgba(27,107,99,0.1)",
                color: "#1b6b63",
              }}
            >
              iOS App
            </span>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5"
              style={{ color: "#082b2b" }}
            >
              A4 to 4×6″
              <br />
              label cropper
            </h1>
            <p
              className="text-lg max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed"
              style={{ color: "#56716a" }}
            >
              Import any A4 shipping label PDF — including Vinted labels — and
              crop it to 4×6″ in seconds, ready for your thermal printer.
            </p>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-opacity hover:opacity-80"
            >
              <Image
                src="/black.svg"
                alt="Download on the App Store"
                width={160}
                height={53}
                priority
              />
            </a>
          </div>

          {/* Screenshots */}
          <div className="flex gap-4 justify-center items-end shrink-0">
            <PhoneFrame
              src="/screenshots/screen1.png"
              alt="Croplet home screen"
              width={200}
              style={{ filter: "drop-shadow(0 24px 40px rgba(8,43,43,0.18))" }}
            />
            <PhoneFrame
              src="/screenshots/screen3.png"
              alt="Croplet label preview"
              width={200}
              style={{
                marginBottom: 32,
                filter: "drop-shadow(0 24px 40px rgba(8,43,43,0.18))",
              }}
            />
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2
            className="text-2xl sm:text-3xl font-bold text-center mb-10"
            style={{ color: "#082b2b" }}
          >
            Everything you need
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-[1.4rem] border"
                style={{
                  background: "rgba(255,255,255,0.82)",
                  borderColor: "rgba(22,48,43,0.1)",
                  boxShadow: "0 4px 16px rgba(13,42,38,0.07)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <f.icon
                  size={24}
                  className="mb-3"
                  style={{ color: "#1b6b63" }}
                />
                <h3
                  className="font-semibold mb-2 text-base"
                  style={{ color: "#16302b" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#56716a" }}
                >
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="flex justify-center mb-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{
                background: "rgba(27,107,99,0.1)",
                color: "#1b6b63",
              }}
            >
              PRO
            </span>
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold text-center mb-4"
            style={{ color: "#082b2b" }}
          >
            Simple pricing
          </h2>
          <p
            className="text-center mb-10 max-w-md mx-auto"
            style={{ color: "#56716a" }}
          >
            Free to download. Upgrade to Croplet Pro to unlock automatic
            OCR-based label detection.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl mx-auto">
            {[
              {
                label: "Monthly",
                price: "€5",
                period: "/month",
                note: "Best for occasional shippers",
                highlight: false,
              },
              {
                label: "Yearly",
                price: "€50",
                period: "/year",
                note: "Best for frequent shippers",
                highlight: true,
              },
              {
                label: "Lifetime",
                price: "€99",
                period: "once",
                note: "Pay once, own forever",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.label}
                className="p-6 rounded-[1.4rem] border text-center"
                style={{
                  background: plan.highlight
                    ? "linear-gradient(135deg, #1b6b63, #2a4a4e)"
                    : "rgba(255,255,255,0.82)",
                  borderColor: plan.highlight
                    ? "transparent"
                    : "rgba(22,48,43,0.1)",
                  boxShadow: plan.highlight
                    ? "0 8px 28px rgba(8,43,43,0.22)"
                    : "0 4px 16px rgba(13,42,38,0.07)",
                  backdropFilter: "blur(10px)",
                  color: plan.highlight ? "#fff" : "#16302b",
                }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{
                    color: plan.highlight ? "rgba(255,255,255,0.7)" : "#56716a",
                  }}
                >
                  {plan.label}
                </div>
                <div className="text-3xl font-bold mb-0.5">{plan.price}</div>
                <div
                  className="text-sm mb-3"
                  style={{
                    color: plan.highlight ? "rgba(255,255,255,0.7)" : "#56716a",
                  }}
                >
                  {plan.period}
                </div>
                <div
                  className="text-xs"
                  style={{
                    color: plan.highlight ? "rgba(255,255,255,0.8)" : "#56716a",
                  }}
                >
                  {plan.note}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div
            className="rounded-[2rem] px-8 py-14"
            style={{
              background: "linear-gradient(135deg, #082b2b 0%, #1b6b63 100%)",
              boxShadow: "0 20px 60px rgba(8,43,43,0.3)",
            }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Start cropping today
            </h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto">
              Free to download. No account needed. Your labels never leave your
              device.
            </p>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-opacity hover:opacity-80"
            >
              <Image
                src="/black.svg"
                alt="Download on the App Store"
                width={160}
                height={53}
              />
            </a>
          </div>
        </section>
      </main>

      <footer
        className="max-w-5xl mx-auto px-6 py-8 w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
        style={{
          color: "#56716a",
          borderTop: "1px solid rgba(22,48,43,0.1)",
        }}
      >
        <div className="flex items-center gap-2">
          <Image
            src="/icon.png"
            alt=""
            width={20}
            height={20}
            className="rounded-md opacity-60"
          />
          <span>© {new Date().getFullYear()} Umberto Ragone</span>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/privacy"
            className="hover:text-[#1b6b63] transition-colors"
          >
            Privacy Policy
          </Link>
          <a
            href="mailto:umberto@ragone.dev"
            className="hover:text-[#1b6b63] transition-colors"
          >
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}
