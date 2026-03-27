"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root> & {
  notchPercent?: number;
};

function Slider({
  className,
  notchPercent,
  ...props
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative z-0 h-1.5 w-full grow overflow-hidden rounded-full bg-[#dceae7]">
        <SliderPrimitive.Range className="absolute h-full bg-[#1b6b63]" />
      </SliderPrimitive.Track>
      {typeof notchPercent === "number" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 z-10 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#16302b40]"
          style={{ left: `${notchPercent}%` }}
        />
      ) : null}
      <SliderPrimitive.Thumb className="relative z-20 block h-4 w-4 rounded-full border border-[#1b6b63] bg-white shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b6b63]/30" />
    </SliderPrimitive.Root>
  );
}

export { Slider };
