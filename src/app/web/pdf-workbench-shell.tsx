"use client";

import dynamic from "next/dynamic";

const PdfWorkbench = dynamic(() => import("./pdf-workbench"), {
  ssr: false,
});

export default function PdfWorkbenchShell() {
  return <PdfWorkbench />;
}
