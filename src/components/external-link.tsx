import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

type ExternalLinkProps = Omit<ComponentPropsWithoutRef<"a">, "children"> & {
  children: ReactNode;
  iconClassName?: string;
};

export function ExternalLink({
  children,
  className,
  iconClassName,
  rel = "noopener noreferrer",
  target = "_blank",
  ...props
}: ExternalLinkProps) {
  return (
    <a
      className={cn("inline-flex items-center", className)}
      rel={rel}
      target={target}
      {...props}
    >
      {children}
      <ArrowUpRight
        size={14}
        aria-hidden="true"
        className={cn("shrink-0", iconClassName)}
      />
    </a>
  );
}
