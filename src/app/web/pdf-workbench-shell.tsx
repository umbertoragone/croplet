"use client";

import dynamic from "next/dynamic";

import type { WebLocale, getWebMessages } from "./localization";

const PdfWorkbench = dynamic(() => import("./pdf-workbench"), {
  ssr: false,
});

type PdfWorkbenchShellProps = {
  locale: WebLocale;
  messages: ReturnType<typeof getWebMessages>["workbench"];
};

export default function PdfWorkbenchShell({
  locale,
  messages,
}: PdfWorkbenchShellProps) {
  return <PdfWorkbench locale={locale} messages={messages} />;
}
