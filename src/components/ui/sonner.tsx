"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      toastOptions={{
        style: {
          borderRadius: "18px",
        },
        classNames: {
          toast:
            "border border-[#16302b14] bg-[#fdfefd] text-[#16302b] shadow-[0_18px_40px_rgba(8,43,43,0.14)]",
          error:
            "border-[#d45555] bg-[#fff1f1] text-[#8f2424] shadow-[0_18px_40px_rgba(170,60,60,0.16)]",
          closeButton:
            "border-inherit bg-inherit text-inherit hover:bg-white/50 hover:text-inherit",
        },
      }}
    />
  );
}
