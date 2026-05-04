"use client";

import { useEffect, useSyncExternalStore } from "react";

import Header from "@/components/Header";

import PdfWorkbenchShell from "./pdf-workbench-shell";
import {
  getWebMessages,
  resolveWebLocale,
  type WebLocale,
  type WebMessages,
} from "./localization";
import WebLanguageSwitcher from "./web-language-switcher";

type WebHomeClientProps = {
  initialLocale: WebLocale;
  initialMessages: WebMessages;
};

const LOCALE_STORAGE_KEY = "croplet-web-locale";
const LOCALE_CHANGE_EVENT = "croplet-web-locale-change";

function getStoredLocale() {
  try {
    return resolveWebLocale(
      window.localStorage.getItem(LOCALE_STORAGE_KEY) ?? undefined,
    );
  } catch {
    return "en";
  }
}

function getBrowserLocale() {
  const searchParams = new URLSearchParams(window.location.search);

  if (searchParams.has("lang")) {
    return resolveWebLocale(searchParams.get("lang") ?? undefined);
  }

  return getStoredLocale();
}

function subscribeToLocaleChanges(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LOCALE_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LOCALE_CHANGE_EVENT, onStoreChange);
  };
}

export default function WebHomeClient({
  initialLocale,
  initialMessages,
}: WebHomeClientProps) {
  const locale = useSyncExternalStore(
    subscribeToLocaleChanges,
    getBrowserLocale,
    () => initialLocale,
  );
  const messages =
    locale === initialLocale ? initialMessages : getWebMessages(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function handleLocaleChange(nextLocale: WebLocale) {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // Language still changes for this session when storage is unavailable.
    }

    const nextUrl = new URL(window.location.href);

    if (nextLocale === "en") {
      nextUrl.searchParams.delete("lang");
    } else {
      nextUrl.searchParams.set("lang", nextLocale);
    }

    window.history.replaceState(null, "", nextUrl);
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  }

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
              onLocaleChange={handleLocaleChange}
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
