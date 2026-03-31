"use client";

let webWorkbenchPreloadPromise: Promise<unknown> | null = null;

export function preloadWebWorkbench() {
  if (!webWorkbenchPreloadPromise) {
    webWorkbenchPreloadPromise = import("@/app/web/pdf-workbench");
  }

  return webWorkbenchPreloadPromise;
}
