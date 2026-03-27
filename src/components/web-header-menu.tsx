"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type WebHeaderMenuProps = {
  children: React.ReactNode;
};

export default function WebHeaderMenu({ children }: WebHeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  function openMenu() {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    setIsMounted(true);
    requestAnimationFrame(() => {
      setIsOpen(true);
    });
  }

  function closeMenu() {
    setIsOpen(false);

    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      setIsMounted(false);
      closeTimeoutRef.current = null;
    }, 180);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={() => {
          if (isOpen) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        className="inline-flex h-10 w-10 items-center justify-center text-[#16302b]"
      >
        {isOpen ? <X size={26} strokeWidth={2.4} /> : <Menu size={26} strokeWidth={2.4} />}
      </button>

      {isMounted ? (
        <>
          <div
            className={`fixed inset-0 z-20 bg-[#082b2b]/8 backdrop-blur-[2px] transition-opacity duration-200 ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`fixed inset-x-0 top-0 z-30 border-b border-[#16302b12] bg-white/96 px-3 sm:px-6 pb-6 pt-[max(1rem,env(safe-area-inset-top))] shadow-[0_20px_60px_rgba(8,43,43,0.12)] backdrop-blur transition-all duration-200 ${
              isOpen
                ? "translate-y-0 opacity-100"
                : "-translate-y-2 opacity-0"
            }`}
          >
            <div className="mx-auto w-full max-w-6xl">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={closeMenu}
                  className="inline-flex h-10 w-10 items-center justify-center text-[#16302b]"
                >
                  <X size={26} strokeWidth={2.4} />
                </button>
              </div>
              <div className="pt-4">{children}</div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
