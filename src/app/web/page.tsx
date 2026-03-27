import Header from "@/components/Header";
import {
  getWebMessages,
  resolveWebLocale,
  type WebLocale,
} from "./localization";
import PdfWorkbenchShell from "./pdf-workbench-shell";
import WebLanguageSwitcher from "./web-language-switcher";

export default async function WebHomePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const { lang } = await searchParams;
  const locale: WebLocale = resolveWebLocale(lang);
  const messages = getWebMessages(locale);

  return (
    <main
      className="min-h-screen md:h-[100dvh] md:overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(27,107,99,0.15), transparent 40%), linear-gradient(180deg, #eef6f3 0%, #f4f7f4 100%)",
      }}
    >
      <div className="flex min-h-full flex-col md:h-full">
        <Header
          currentPath="/web"
          variant="web"
          webProduct={messages.header.product}
          webBadge={messages.header.badge}
          webTitle={messages.header.title}
          webControls={
            <WebLanguageSwitcher
              locale={locale}
              placeholder={messages.languageSwitcher.placeholder}
              options={messages.languageSwitcher.options}
            />
          }
        />

        <section className="mx-auto w-full max-w-6xl flex-1 min-h-0 px-3 sm:px-6 pb-5 md:overflow-hidden">
          <PdfWorkbenchShell locale={locale} messages={messages.workbench} />
        </section>
      </div>
    </main>
  );
}
