"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { WebLocale } from "./localization";

type WebLanguageSwitcherProps = {
  locale: WebLocale;
  placeholder: string;
  options: Record<WebLocale, string>;
  onLocaleChange: (locale: WebLocale) => void;
};

export default function WebLanguageSwitcher({
  locale,
  placeholder,
  options,
  onLocaleChange,
}: WebLanguageSwitcherProps) {
  function handleLocaleChange(nextLocale: string) {
    onLocaleChange(nextLocale === "it" ? "it" : "en");
  }

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger
        aria-label={placeholder}
        className="h-11 w-full min-w-0 rounded-full border-[#16302b16] bg-white/90 px-4 py-2 text-[0.95rem] shadow-[0_10px_30px_rgba(8,43,43,0.06)] md:h-9 md:min-w-[9.5rem] md:w-auto md:px-3 md:py-1.5 md:text-sm"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        align="end"
        className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]"
      >
        <SelectItem value="en">{options.en}</SelectItem>
        <SelectItem value="it">{options.it}</SelectItem>
      </SelectContent>
    </Select>
  );
}
