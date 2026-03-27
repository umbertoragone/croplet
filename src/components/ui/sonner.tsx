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
          border: "1px solid rgba(22,48,43,0.08)",
          background: "#fdfefd",
          color: "#16302b",
          boxShadow: "0 18px 40px rgba(8,43,43,0.14)",
        },
        classNames: {
          toast: "border-[#16302b14] bg-[#fdfefd] text-[#16302b]",
          error:
            "border-[#d45555] bg-[#fffdfd] text-[#a12f2f] shadow-[0_18px_40px_rgba(170,60,60,0.12)]",
        },
      }}
    />
  );
}
