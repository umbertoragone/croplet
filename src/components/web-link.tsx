"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useCallback } from "react";

import { preloadWebWorkbench } from "@/lib/preload-web-workbench";

type WebLinkProps = Omit<ComponentProps<typeof Link>, "href" | "prefetch">;

export default function WebLink({
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: WebLinkProps) {
  const router = useRouter();

  const warmRoute = useCallback(() => {
    router.prefetch("/web");
    void preloadWebWorkbench();
  }, [router]);

  return (
    <Link
      {...props}
      href="/web"
      prefetch
      onMouseEnter={(event) => {
        warmRoute();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        warmRoute();
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        warmRoute();
        onTouchStart?.(event);
      }}
    />
  );
}
