"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonGroupProps = React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
};

type ButtonGroupSeparatorProps = React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
};

function ButtonGroup({
  className,
  orientation = "horizontal",
  ...props
}: ButtonGroupProps) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(
        "inline-flex overflow-hidden",
        orientation === "horizontal"
          ? "flex-row [&>[data-slot=button]]:rounded-none [&>[data-slot=button]]:shadow-none [&>[data-slot=button]:first-child]:rounded-l-full [&>[data-slot=button]:last-child]:rounded-r-full"
          : "flex-col [&>[data-slot=button]]:rounded-none [&>[data-slot=button]]:shadow-none [&>[data-slot=button]:first-child]:rounded-t-2xl [&>[data-slot=button]:last-child]:rounded-b-2xl",
        className,
      )}
      {...props}
    />
  );
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: ButtonGroupSeparatorProps) {
  return (
    <div
      aria-hidden="true"
      data-slot="button-group-separator"
      data-orientation={orientation}
      className={cn(
        "shrink-0 bg-[#16302b14]",
        orientation === "vertical" ? "w-px self-stretch" : "h-px self-stretch",
        className,
      )}
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupSeparator };
