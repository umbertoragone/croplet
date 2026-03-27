import Link from "next/link";
import PdfWorkbenchShell from "./pdf-workbench-shell";

export default function WebHomePage() {
  return (
    <main
      className="min-h-screen md:h-[100dvh] md:overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(27,107,99,0.15), transparent 40%), linear-gradient(180deg, #eef6f3 0%, #f4f7f4 100%)",
      }}
    >
      <div className="flex min-h-full flex-col md:h-full">
        <header className="mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between px-6 py-4 md:py-3">
          <div className="flex items-center gap-4">
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

          <Link
            href="/"
            className="border-b border-transparent text-sm text-[#56716a] transition hover:border-[#1b6b63] hover:text-[#1b6b63]"
          >
            croplet.app
          </Link>
        </header>

        <section className="mx-auto w-full max-w-6xl flex-1 min-h-0 px-6 pb-5 md:overflow-hidden">
          <PdfWorkbenchShell />
        </section>
      </div>
    </main>
  );
}
