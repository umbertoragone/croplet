"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { preloadWebWorkbench } from "@/lib/preload-web-workbench";

function shouldWarmRoute() {
  const connection = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean };
    }
  ).connection;

  if (connection?.saveData) {
    return false;
  }

  return (
    connection?.effectiveType !== "slow-2g" && connection?.effectiveType !== "2g"
  );
}

export default function WebRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    if (!shouldWarmRoute()) {
      return;
    }

    const warmRoute = () => {
      router.prefetch("/web");
      void preloadWebWorkbench();
    };

    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(warmRoute, { timeout: 2200 });

      return () => {
        window.cancelIdleCallback(handle);
      };
    }

    const handle = globalThis.setTimeout(warmRoute, 1200);

    return () => {
      globalThis.clearTimeout(handle);
    };
  }, [router]);

  return null;
}
