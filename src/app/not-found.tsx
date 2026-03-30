import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#f5f3ec] text-[#16302b]"
      style={{
        backgroundImage: [
          "radial-gradient(circle at 18% 20%, rgba(27,107,99,0.18), transparent 28%)",
          "radial-gradient(circle at 82% 22%, rgba(174,120,35,0.14), transparent 22%)",
          "linear-gradient(180deg, #f8f5ee 0%, #eef3ef 100%)",
        ].join(", "),
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60" />
        <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#16302b]/7" />
        <div className="absolute inset-x-6 top-6 bottom-6 rounded-[2rem] border border-white/45" />
      </div>

      <section className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-6 sm:px-10 sm:py-8">
        <div>
          <Link
            href="/"
            className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-[#1b6b63] transition-opacity hover:opacity-70"
          >
            Croplet
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-16 sm:py-24">
          <div className="max-w-2xl text-center">
            <div
              aria-hidden="true"
              className="text-[7rem] leading-none font-semibold tracking-[-0.06em] text-[#16302b]/10 sm:text-[10rem] lg:text-[12rem]"
            >
              404
            </div>

            <p className="mb-3 text-[0.75rem] font-semibold uppercase tracking-[0.35em] text-[#ae7823]">
              Not Found
            </p>
            <h1
              className="text-4xl font-semibold leading-[0.95] tracking-[-0.04em] text-[#082b2b] sm:text-6xl"
            >
              This page does not exist.
            </h1>
            <p className="mx-auto mt-5 max-w-md text-base leading-7 text-[#56716a] sm:text-lg">
              Return to the homepage and continue from there.
            </p>

            <div className="mt-8 flex justify-center">
              <Button
                asChild
                size="lg"
                className="px-6 shadow-lg shadow-[#16302b]/10"
              >
                <Link href="/">
                  <ArrowLeft size={16} />
                  Back to home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
