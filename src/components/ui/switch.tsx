"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-8 w-14 cursor-pointer items-center rounded-full border border-[#16302b14] bg-[#dceae7] p-[3px] shadow-[inset_0_1px_2px_rgba(8,43,43,0.08)] transition-[background-color,border-color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-[#1b6b63]/25 data-[state=checked]:border-[#1b6b63] data-[state=checked]:bg-[#1b6b63] data-[state=unchecked]:bg-[#dceae7]",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block h-6 w-6 rounded-full bg-white shadow-[0_4px_12px_rgba(8,43,43,0.18)] ring-0 transition-transform duration-200 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
