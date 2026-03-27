import Image from "next/image";
import Link from "next/link";

interface HeaderProps {
  currentPath?: "/" | "/privacy" | "/web";
  appStoreUrl?: string;
  variant?: "marketing" | "web";
}

function navLinkClass(isActive: boolean) {
  return isActive
    ? "text-[#1b6b63]"
    : "text-[#56716a] transition-colors hover:text-[#1b6b63]";
}

export default function Header({
  currentPath,
  appStoreUrl,
  variant = "marketing",
}: HeaderProps) {
  if (variant === "web") {
    return (
      <header className="mx-auto flex w-full max-w-6xl shrink-0 items-start px-6 py-4 md:items-center md:py-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#1b6b63]">
              Croplet Web
            </div>
            <div className="rounded-full border border-[#1b6b63]/16 bg-[#1b6b63]/8 px-2 py-0.5 text-[0.52rem] font-semibold uppercase tracking-[0.2em] text-[#1b6b63]">
              Alpha
            </div>
          </div>
          <div className="hidden h-4 w-px bg-[#16302b14] md:block" />
          <h1 className="text-lg font-semibold tracking-tight text-[#082b2b] sm:text-xl">
            A4 to 4×6&quot; label cropper
          </h1>
        </div>
      </header>
    );
  }

  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
      <Link href="/" className="flex items-center gap-3 group">
        <Image src="/icon.png" alt="Croplet icon" width={36} height={36} className="rounded-xl" />
        <span className="font-semibold tracking-tight text-[#16302b] transition-colors group-hover:text-[#1b6b63]">
          Croplet
        </span>
      </Link>
      <nav className="flex items-center gap-6 text-sm">
        <Link href="/web" className={navLinkClass(currentPath === "/web")}>
          Web
        </Link>
        <Link href="/privacy" className={navLinkClass(currentPath === "/privacy")}>
          Privacy
        </Link>
        {appStoreUrl ? (
          <a
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-opacity hover:opacity-80"
          >
            <Image src="/black.svg" alt="Download on the App Store" width={120} height={40} />
          </a>
        ) : null}
      </nav>
    </header>
  );
}
