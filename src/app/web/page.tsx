import Header from "@/components/Header";
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
        <Header currentPath="/web" variant="web" />

        <section className="mx-auto w-full max-w-6xl flex-1 min-h-0 px-6 pb-5 md:overflow-hidden">
          <PdfWorkbenchShell />
        </section>
      </div>
    </main>
  );
}
