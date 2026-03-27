"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { useWebHaptics } from "web-haptics/react";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  disabled,
  onCheckedChange,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
}) {
  const { trigger } = useWebHaptics();

  const handleCheckedChange = React.useCallback(
    (checked: boolean) => {
      if (!disabled) {
        void trigger("selection");
      }

      onCheckedChange?.(checked);
    },
    [disabled, onCheckedChange, trigger],
  );

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-[#1b6b63] focus-visible:ring-3 focus-visible:ring-[#1b6b63]/20 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] data-[state=checked]:bg-[#1b6b63] data-[state=unchecked]:bg-[#dceae7] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className,
      )}
      disabled={disabled}
      onCheckedChange={handleCheckedChange}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-white shadow-[0_2px_8px_rgba(8,43,43,0.16)] ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-[state=checked]:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-[state=checked]:translate-x-[calc(100%-2px)] group-data-[size=default]/switch:data-[state=unchecked]:translate-x-0 group-data-[size=sm]/switch:data-[state=unchecked]:translate-x-0"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
