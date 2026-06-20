"use client";

import Link from "next/link";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  Download,
  FileUp,
  Info,
  Link as LinkIcon,
  LoaderCircle,
  Minus,
  Plus,
  Printer,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { degrees, PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Document, Page, pdfjs } from "react-pdf";
import { toast } from "sonner";
import type { PSM, Worker as TesseractWorker } from "tesseract.js";
import { createWorker } from "tesseract.js";
import { useWebHaptics } from "web-haptics/react";

import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { ExternalLink } from "@/components/external-link";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import type { WebLocale, getWebMessages } from "./localization";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type LabelType =
  | "posteItaliane"
  | "vintedGo"
  | "brt"
  | "inpostFamily"
  | "inpostItaly"
  | "ups"
  | "dhl"
  | "manualEditor";

type CropPreset = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  scale: number;
};

type RecipientNameLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  initialFontSize: number;
};

type DetectedLabel = {
  labelType: Exclude<LabelType, "manualEditor">;
  useHalfPageBRT?: boolean;
};

type SliderWithDefaultNotchProps = React.ComponentProps<typeof Slider> & {
  notchValue: number;
  onPassNotch?: () => void;
};

type PositionedTextLine = {
  text: string;
  x: number;
  y: number;
};

type PositionedTextItem = {
  str: string;
  transform: number[];
};

function getFileNameFromContentDisposition(headerValue: string | null) {
  if (!headerValue) {
    return null;
  }

  const encodedFileName = headerValue.match(/filename\*=UTF-8''([^;]+)/i)?.[1];

  if (encodedFileName) {
    try {
      return decodeURIComponent(encodedFileName);
    } catch {
      return encodedFileName;
    }
  }

  const plainFileName = headerValue.match(/filename="?([^";]+)"?/i)?.[1];
  return plainFileName ?? null;
}

const OUTPUT_PAGE_WIDTH = 288;
const OUTPUT_PAGE_HEIGHT = 432;
const AUTO_IMPORT_QUERY_PARAM = "import";
const DEFAULT_OFFSET_MIN = -120;
const DEFAULT_OFFSET_MAX = 120;
const MANUAL_OFFSET_MIN = -240;
const MANUAL_OFFSET_MAX = 240;
const DEFAULT_USE_HALF_PAGE_BRT = true;
const DEFAULT_SHOW_RECIPIENT_NAME = true;
const DEFAULT_SHOW_VINTED_GO_RECIPIENT_NAME = true;
const DEFAULT_SHOW_INPOST_FAMILY_RECIPIENT_NAME = false;
const DEFAULT_SHOW_INPOST_ITALY_RECIPIENT_NAME = false;
const DEFAULT_RECIPIENT_NAME_FONT_SIZE = 18;
const DEFAULT_HIDE_POSTE_ITALIANE_SENDER_ADDRESS = false;
const DEFAULT_HIDE_VINTED_GO_SENDER_ADDRESS = false;
const DEFAULT_HIDE_INPOST_ITALY_SENDER_ADDRESS = false;
const DEFAULT_SCALE_OFFSET_MIN = -0.5;
const DEFAULT_SCALE_OFFSET_MAX = 0.5;
const MANUAL_SCALE_OFFSET_MIN = -0.8;
const MANUAL_SCALE_OFFSET_MAX = 2;
const ROTATION_OFFSET_MIN = -270;
const ROTATION_OFFSET_MAX = 270;
const USE_HALF_PAGE_BRT_STORAGE_KEY = "croplet-web-use-half-page-brt";
const SHOW_RECIPIENT_NAME_STORAGE_KEY = "croplet-web-show-recipient-name";
const SHOW_VINTED_GO_RECIPIENT_NAME_STORAGE_KEY =
  "croplet-web-show-vinted-go-recipient-name";
const SHOW_INPOST_FAMILY_RECIPIENT_NAME_STORAGE_KEY =
  "croplet-web-show-inpost-family-recipient-name";
const SHOW_INPOST_ITALY_RECIPIENT_NAME_STORAGE_KEY =
  "croplet-web-show-inpost-italy-recipient-name";
const RECIPIENT_NAME_FONT_SIZE_STORAGE_KEY =
  "croplet-web-recipient-name-font-size";
const HIDE_POSTE_ITALIANE_SENDER_ADDRESS_STORAGE_KEY =
  "croplet-web-hide-poste-italiane-sender-address";
const HIDE_VINTED_GO_SENDER_ADDRESS_STORAGE_KEY =
  "croplet-web-hide-vinted-go-sender-address";
const HIDE_INPOST_ITALY_SENDER_ADDRESS_STORAGE_KEY =
  "croplet-web-hide-inpost-italy-sender-address";
const INPOST_LOGO_REGION = {
  x: 0.62,
  y: 0.58,
  width: 0.33,
  height: 0.24,
} as const;
const INPOST_FAMILY_RECIPIENT_REGION = {
  x: 0.02,
  y: 0.34,
  width: 0.48,
  height: 0.24,
} as const;
const INPOST_ITALY_SENDER_ADDRESS_MASK = {
  x: 0.42,
  y: 0.32,
  width: 0.5,
  height: 0.08,
} as const;
const INPOST_ITALY_RECIPIENT_REGION = {
  x: 0.36,
  y: 0.37,
  width: 0.48,
  height: 0.13,
} as const;
const POSTE_ITALIANE_SENDER_ADDRESS_MASK = {
  x: 157,
  y: 114,
  width: 18,
  height: 170.5,
} as const;
const VINTED_GO_SENDER_ADDRESS_MASK = {
  x: 157,
  y: 114,
  width: 18,
  height: 170.5,
} as const;
const POSTE_ITALIANE_RECIPIENT_REGION = {
  x: 0.27,
  y: 0.22,
  width: 0.45,
  height: 0.17,
} as const;
const POSTE_ITALIANE_BLOCKED_WORDS = new Set([
  "destinatario",
  "consegna",
  "punto",
  "poste",
  "tracking",
  "barcode",
  "mittente",
  "priority",
  "ship",
  "recipient",
  "via",
  "presso",
  "locker",
  "casella",
  "numero",
  "peso",
]);
const POSTE_ITALIANE_RECIPIENT_SKIP_TOKENS = [
  "destinatario",
  "consegna",
  "punto poste",
  "via ",
  "cap ",
  "tracking",
  "codice",
];

const LABEL_OPTIONS: { value: LabelType }[] = [
  { value: "posteItaliane" },
  { value: "vintedGo" },
  { value: "brt" },
  { value: "inpostFamily" },
  { value: "inpostItaly" },
  { value: "ups" },
  { value: "dhl" },
  { value: "manualEditor" },
];
const DEFAULT_LABEL_TYPE = LABEL_OPTIONS[0]?.value ?? "posteItaliane";
const BRT_RIF_PATTERN = /rif\s*\.\s*:\s*\d{8,12}/i;
const BRT_RIF_MARKER_PATTERN = /\brif\./i;
const BRT_TEN_DIGIT_PATTERN = /\b\d{10}\b/;
const BRT_LOGO_PATTERN = /\bbrt\b/i;

const BASE_PRESETS: Record<Exclude<LabelType, "brt">, CropPreset> = {
  posteItaliane: {
    x: 0,
    y: 503,
    width: 432,
    height: 288,
    rotate: 270,
    scale: 1,
  },
  vintedGo: {
    x: -6.5,
    y: 478.5,
    width: 288,
    height: 432,
    rotate: 180,
    scale: 1.11,
  },
  inpostFamily: {
    x: 84,
    y: 33,
    width: 432,
    height: 288,
    rotate: 90,
    scale: 1.03,
  },
  inpostItaly: {
    x: 0,
    y: 0,
    width: OUTPUT_PAGE_WIDTH,
    height: OUTPUT_PAGE_HEIGHT,
    rotate: 0,
    scale: 1.09,
  },
  ups: { x: 60, y: 60, width: 288, height: 432, rotate: 0, scale: 1 },
  dhl: { x: 82, y: 90, width: 288, height: 432, rotate: 0, scale: 0.85 },
  manualEditor: { x: 48, y: 45, width: 288, height: 432, rotate: 0, scale: 1 },
};

const BRT_PRESETS = {
  fullPage: {
    x: -40,
    y: 480,
    width: 432,
    height: 288,
    rotate: 270,
    scale: 1.6,
  },
  halfPage: { x: 31, y: 298, width: 288, height: 432, rotate: 0, scale: 1.08 },
} satisfies Record<"fullPage" | "halfPage", CropPreset>;

function initialPreset(
  labelType: LabelType,
  useHalfPageBRT: boolean,
): CropPreset {
  if (labelType === "brt") {
    return {
      ...(useHalfPageBRT ? BRT_PRESETS.halfPage : BRT_PRESETS.fullPage),
    };
  }

  return { ...BASE_PRESETS[labelType] };
}

function usesCenteredFullPage(labelType: LabelType) {
  return labelType === "manualEditor" || labelType === "inpostItaly";
}

function usesSourceCropOffsets(labelType: LabelType) {
  return labelType === "vintedGo";
}

function presetWithSourceCropOffsets(
  preset: CropPreset,
  labelType: LabelType,
  horizontalOffset: number,
  verticalOffset: number,
) {
  if (!usesSourceCropOffsets(labelType)) {
    return preset;
  }

  return {
    ...preset,
    x: preset.x + horizontalOffset,
    y: preset.y - verticalOffset,
  };
}

function outputRectForSourceMask(
  mask: { x: number; y: number; width: number; height: number },
  pageWidth: number,
  pageHeight: number,
  pageRotate: number,
  fitScale: number,
  positionedPage: { x: number; y: number },
) {
  const left = pageWidth * mask.x;
  const right = pageWidth * (mask.x + mask.width);
  const top = pageHeight * (1 - mask.y);
  const bottom = pageHeight * (1 - mask.y - mask.height);
  const points = [
    { x: left, y: bottom },
    { x: right, y: bottom },
    { x: right, y: top },
    { x: left, y: top },
  ].map((point) => {
    switch (pageRotate) {
      case 90:
        return {
          x: positionedPage.x - point.y * fitScale,
          y: positionedPage.y + point.x * fitScale,
        };
      case 180:
        return {
          x: positionedPage.x - point.x * fitScale,
          y: positionedPage.y - point.y * fitScale,
        };
      case 270:
        return {
          x: positionedPage.x + point.y * fitScale,
          y: positionedPage.y - point.x * fitScale,
        };
      default:
        return {
          x: positionedPage.x + point.x * fitScale,
          y: positionedPage.y + point.y * fitScale,
        };
    }
  });
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);

  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  };
}

function normalizePosteItalianeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function normalizeDetectedText(value: string) {
  return normalizePosteItalianeText(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function isVintedGoLabel(text: string) {
  const compactText = text.replace(/\s+/g, "");

  return (
    includesAnyKeyword(text, [
      "vinted go",
      "vintedgo",
      "vinted g0",
      "vinted ge",
      "v lockers",
      "vlockers",
    ]) ||
    compactText.includes("vintedgo") ||
    compactText.includes("vlockers")
  );
}

function clampRecipientNameFontSize(value: number) {
  return Math.max(10, Math.min(72, value));
}

function readStoredUseHalfPageBrtPreference() {
  try {
    const storedValue = window.localStorage.getItem(
      USE_HALF_PAGE_BRT_STORAGE_KEY,
    );

    if (storedValue === "true") {
      return { hasStoredValue: true, value: true };
    }

    if (storedValue === "false") {
      return { hasStoredValue: true, value: false };
    }
  } catch {
    // Fall back to default when storage is unavailable.
  }

  return {
    hasStoredValue: false,
    value: DEFAULT_USE_HALF_PAGE_BRT,
  };
}

function getStoredShowRecipientNamePreference() {
  try {
    const storedValue = window.localStorage.getItem(
      SHOW_RECIPIENT_NAME_STORAGE_KEY,
    );

    if (storedValue === "true") {
      return true;
    }

    if (storedValue === "false") {
      return false;
    }
  } catch {
    // Fall back to default when storage is unavailable.
  }

  return DEFAULT_SHOW_RECIPIENT_NAME;
}

function getStoredShowVintedGoRecipientNamePreference() {
  try {
    const storedValue = window.localStorage.getItem(
      SHOW_VINTED_GO_RECIPIENT_NAME_STORAGE_KEY,
    );

    if (storedValue === "true") {
      return true;
    }

    if (storedValue === "false") {
      return false;
    }
  } catch {
    // Fall back to default when storage is unavailable.
  }

  return DEFAULT_SHOW_VINTED_GO_RECIPIENT_NAME;
}

function getStoredShowInpostFamilyRecipientNamePreference() {
  try {
    const storedValue = window.localStorage.getItem(
      SHOW_INPOST_FAMILY_RECIPIENT_NAME_STORAGE_KEY,
    );

    if (storedValue === "true") {
      return true;
    }

    if (storedValue === "false") {
      return false;
    }
  } catch {
    // Fall back to default when storage is unavailable.
  }

  return DEFAULT_SHOW_INPOST_FAMILY_RECIPIENT_NAME;
}

function getStoredShowInpostItalyRecipientNamePreference() {
  try {
    const storedValue = window.localStorage.getItem(
      SHOW_INPOST_ITALY_RECIPIENT_NAME_STORAGE_KEY,
    );

    if (storedValue === "true") {
      return true;
    }

    if (storedValue === "false") {
      return false;
    }
  } catch {
    // Fall back to default when storage is unavailable.
  }

  return DEFAULT_SHOW_INPOST_ITALY_RECIPIENT_NAME;
}

function getStoredHidePosteItalianeSenderAddressPreference() {
  try {
    const storedValue = window.localStorage.getItem(
      HIDE_POSTE_ITALIANE_SENDER_ADDRESS_STORAGE_KEY,
    );

    if (storedValue === "true") {
      return true;
    }

    if (storedValue === "false") {
      return false;
    }
  } catch {
    // Fall back to default when storage is unavailable.
  }

  return DEFAULT_HIDE_POSTE_ITALIANE_SENDER_ADDRESS;
}

function getStoredHideVintedGoSenderAddressPreference() {
  try {
    const storedValue = window.localStorage.getItem(
      HIDE_VINTED_GO_SENDER_ADDRESS_STORAGE_KEY,
    );

    if (storedValue === "true") {
      return true;
    }

    if (storedValue === "false") {
      return false;
    }
  } catch {
    // Fall back to default when storage is unavailable.
  }

  return DEFAULT_HIDE_VINTED_GO_SENDER_ADDRESS;
}

function getStoredHideInpostItalySenderAddressPreference() {
  try {
    const storedValue = window.localStorage.getItem(
      HIDE_INPOST_ITALY_SENDER_ADDRESS_STORAGE_KEY,
    );

    if (storedValue === "true") {
      return true;
    }

    if (storedValue === "false") {
      return false;
    }
  } catch {
    // Fall back to default when storage is unavailable.
  }

  return DEFAULT_HIDE_INPOST_ITALY_SENDER_ADDRESS;
}

function getStoredRecipientNameFontSizePreference() {
  try {
    const storedValue = window.localStorage.getItem(
      RECIPIENT_NAME_FONT_SIZE_STORAGE_KEY,
    );

    if (storedValue) {
      const parsedValue = Number(storedValue);

      if (Number.isFinite(parsedValue)) {
        return clampRecipientNameFontSize(parsedValue);
      }
    }
  } catch {
    // Fall back to default when storage is unavailable.
  }

  return DEFAULT_RECIPIENT_NAME_FONT_SIZE;
}

function isBrtLabel(text: string) {
  const corpus = normalizePosteItalianeText(text);

  if (BRT_RIF_PATTERN.test(corpus)) {
    return true;
  }

  if (BRT_LOGO_PATTERN.test(corpus)) {
    return true;
  }

  return (
    BRT_RIF_MARKER_PATTERN.test(corpus) && BRT_TEN_DIGIT_PATTERN.test(corpus)
  );
}

function isInpostItalyLabel(text: string) {
  const hasInpostLogoText = text.includes("inpost");
  const hasCustomerReference =
    text.includes("numero riferimento cliente") ||
    text.includes("numero riferimento") ||
    text.includes("riferimento cliente");
  const routingFeatureCount = [
    text.includes("deposito"),
    text.includes("giro"),
    text.includes("provincia"),
  ].filter(Boolean).length;

  return (
    (hasCustomerReference && routingFeatureCount >= 1) ||
    (hasInpostLogoText && routingFeatureCount >= 2) ||
    routingFeatureCount >= 3
  );
}

function detectLabelFromExtractedText(
  text: string,
  pageWidth: number,
  pageHeight: number,
): DetectedLabel | null {
  const foldedText = normalizePosteItalianeText(text);
  const normalizedText = normalizeDetectedText(text);

  if (!foldedText && !normalizedText) {
    return null;
  }

  if (isInpostItalyLabel(normalizedText)) {
    return { labelType: "inpostItaly" };
  }

  const looksLikeInpostForm =
    includesAnyKeyword(normalizedText, [
      "shipment n",
      "shipment no",
      "shipment date",
      "parcel n",
      "parcel no",
      "weight kg",
      "volume l",
    ]) &&
    includesAnyKeyword(normalizedText, [
      "receiver",
      "sender",
      "locker",
      "24 7",
      "24r",
    ]);

  if (looksLikeInpostForm) {
    return { labelType: "inpostFamily" };
  }

  if (
    includesAnyKeyword(normalizedText, [
      "inpost",
      "mondial relay",
      "mondialrelay",
      "hermes",
      "paczkomat",
      "punto pack",
    ])
  ) {
    return { labelType: "inpostFamily" };
  }

  if (isVintedGoLabel(normalizedText)) {
    return { labelType: "vintedGo" };
  }

  if (isBrtLabel(foldedText)) {
    return {
      labelType: "brt",
      useHalfPageBRT: pageHeight <= 1000 && pageWidth <= 800,
    };
  }

  if (
    normalizedText.includes("ups") ||
    normalizedText.includes("united parcel service") ||
    /\b1z[a-z0-9]{6,}\b/i.test(text.replace(/\s+/g, ""))
  ) {
    return { labelType: "ups" };
  }

  if (
    includesAnyKeyword(normalizedText, ["dhl", "express worldwide", "waybill"])
  ) {
    return { labelType: "dhl" };
  }

  if (
    includesAnyKeyword(normalizedText, [
      "poste italiane",
      "poste delivery",
      "postedelivery",
      "postedeliverybusiness",
      "sda",
    ])
  ) {
    return { labelType: "posteItaliane" };
  }

  return null;
}

function cropCanvasRegion(
  sourceCanvas: HTMLCanvasElement,
  region: { x: number; y: number; width: number; height: number },
) {
  const regionCanvas = document.createElement("canvas");
  regionCanvas.width = Math.max(
    1,
    Math.round(sourceCanvas.width * region.width),
  );
  regionCanvas.height = Math.max(
    1,
    Math.round(sourceCanvas.height * region.height),
  );

  const context = regionCanvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, regionCanvas.width, regionCanvas.height);
  context.drawImage(
    sourceCanvas,
    sourceCanvas.width * region.x,
    sourceCanvas.height * region.y,
    regionCanvas.width,
    regionCanvas.height,
    0,
    0,
    regionCanvas.width,
    regionCanvas.height,
  );

  return regionCanvas;
}

function sanitizedNameCandidate(text: string) {
  return text
    .replace(/[^\p{L} ./'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikePersonalName(candidate: string) {
  const words = candidate
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length < 2) {
    return false;
  }

  const letterOnlyWords = words.filter((word) =>
    [...word].every((character) => /[\p{L}'-]/u.test(character)),
  );

  return (
    letterOnlyWords.length >= 2 &&
    letterOnlyWords.every((word) => word.length >= 2)
  );
}

function isPreferredPosteItalianeRecipient(candidate: string) {
  if (!looksLikePersonalName(candidate)) {
    return false;
  }

  const normalizedWords = new Set(
    normalizePosteItalianeText(candidate)
      .split(/[^a-z'-]+/i)
      .map((token) => token.trim())
      .filter(Boolean),
  );

  for (const blockedWord of POSTE_ITALIANE_BLOCKED_WORDS) {
    if (normalizedWords.has(blockedWord)) {
      return false;
    }
  }

  return true;
}

function isInpostFamilyRecipientStopLine(normalizedLine: string) {
  const compactLine = normalizedLine.replace(/\s+/g, "");

  return (
    normalizedLine.includes("sender") ||
    normalizedLine.includes("receiver") ||
    normalizedLine.includes("locker") ||
    normalizedLine.includes("shipment") ||
    normalizedLine.includes("weight") ||
    normalizedLine.includes("volume") ||
    normalizedLine.includes("parcel") ||
    normalizedLine.includes("customer reference") ||
    normalizedLine.includes("order reference") ||
    normalizedLine.includes("inpost") ||
    normalizedLine.includes("24 7") ||
    normalizedLine.includes("24r") ||
    /^\d/.test(compactLine)
  );
}

function extractInpostFamilyRecipientFromTextLines(lines: string[]) {
  const receiverIndex = lines.findIndex((line) =>
    normalizeDetectedText(line).includes("receiver"),
  );

  if (receiverIndex < 0) {
    for (const line of lines) {
      const normalizedLine = normalizeDetectedText(line);

      if (isInpostFamilyRecipientStopLine(normalizedLine)) {
        break;
      }

      const candidate = sanitizedNameCandidate(line);

      if (isPreferredPosteItalianeRecipient(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  const receiverLine = lines[receiverIndex] ?? "";
  const inlineCandidate = sanitizedNameCandidate(
    receiverLine.replace(/^.*receiver\s*:?\s*/i, ""),
  );

  if (isPreferredPosteItalianeRecipient(inlineCandidate)) {
    return inlineCandidate;
  }

  const upperBound = Math.min(lines.length, receiverIndex + 6);

  for (const line of lines.slice(receiverIndex + 1, upperBound)) {
    const normalizedLine = normalizeDetectedText(line);

    if (isInpostFamilyRecipientStopLine(normalizedLine)) {
      break;
    }

    const candidate = sanitizedNameCandidate(line);

    if (isPreferredPosteItalianeRecipient(candidate)) {
      return candidate;
    }
  }

  return null;
}

function extractInpostItalyRecipientFromTextLines(lines: string[]) {
  const destinationIndex = lines.findIndex((line) =>
    normalizePosteItalianeText(line).includes("destinatario"),
  );

  if (destinationIndex < 0) {
    return null;
  }

  const destinationLine = lines[destinationIndex] ?? "";
  const inlineCandidate = sanitizedNameCandidate(
    destinationLine.replace(/^.*destinatario\s*:?\s*/i, ""),
  );

  if (isPreferredPosteItalianeRecipient(inlineCandidate)) {
    return inlineCandidate;
  }

  const upperBound = Math.min(lines.length, destinationIndex + 5);

  for (const line of lines.slice(destinationIndex + 1, upperBound)) {
    const normalizedLine = normalizePosteItalianeText(line);

    if (
      normalizedLine.includes("mittente") ||
      normalizedLine.includes("destinatario") ||
      normalizedLine.includes("via ") ||
      normalizedLine.includes("presso") ||
      normalizedLine.includes("dimensioni") ||
      /^[a-z]{2,}\d/i.test(normalizedLine.replace(/\s+/g, ""))
    ) {
      break;
    }

    const candidate = sanitizedNameCandidate(line);

    if (isPreferredPosteItalianeRecipient(candidate)) {
      return candidate;
    }
  }

  return null;
}

function isInpostItalyRecipientStopLine(normalizedLine: string) {
  return (
    normalizedLine.includes("mittente") ||
    normalizedLine.includes("destinatario") ||
    normalizedLine.includes("via ") ||
    normalizedLine.includes("presso") ||
    normalizedLine.includes("dimensioni") ||
    /^[a-z]{2,}\d/i.test(normalizedLine.replace(/\s+/g, ""))
  );
}

function extractInpostItalyRecipientFromPositionedTextLines(
  lines: PositionedTextLine[],
) {
  const destinationLine = lines.find((line) =>
    normalizePosteItalianeText(line.text).includes("destinatario"),
  );

  if (!destinationLine) {
    return null;
  }

  const inlineCandidate = sanitizedNameCandidate(
    destinationLine.text.replace(/^.*destinatario\s*:?\s*/i, ""),
  );

  if (isPreferredPosteItalianeRecipient(inlineCandidate)) {
    return inlineCandidate;
  }

  const nearbyLines = lines.filter((line) => {
    const normalizedLine = normalizePosteItalianeText(line.text);

    return (
      line !== destinationLine &&
      !normalizedLine.includes("mittente") &&
      !normalizedLine.includes("destinatario") &&
      line.x >= destinationLine.x - 24 &&
      line.x <= destinationLine.x + 240 &&
      Math.abs(line.y - destinationLine.y) <= 140
    );
  });
  const nearestStopLine = nearbyLines
    .filter((line) =>
      isInpostItalyRecipientStopLine(normalizePosteItalianeText(line.text)),
    )
    .map((line) => ({
      direction: Math.sign(line.y - destinationLine.y),
      distance: Math.abs(line.y - destinationLine.y),
    }))
    .filter((line) => line.direction !== 0 && line.distance > 1)
    .sort((first, second) => first.distance - second.distance)[0];

  if (!nearestStopLine) {
    return null;
  }

  return (
    nearbyLines
      .map((line) => ({
        candidate: sanitizedNameCandidate(line.text),
        direction: Math.sign(line.y - destinationLine.y),
        distance: Math.abs(line.y - destinationLine.y),
      }))
      .filter(
        (line) =>
          line.direction === nearestStopLine.direction &&
          line.distance > 1 &&
          line.distance < nearestStopLine.distance &&
          isPreferredPosteItalianeRecipient(line.candidate),
      )
      .sort((first, second) => first.distance - second.distance)[0]
      ?.candidate ?? null
  );
}

function extractPosteItalianeRecipientFromTextLines(lines: string[]) {
  if (!lines.length) {
    return null;
  }

  const destinationIndex = lines.findIndex((line) =>
    normalizePosteItalianeText(line).includes("destinatario"),
  );

  if (destinationIndex >= 0) {
    const upperBound = Math.min(lines.length, destinationIndex + 4);

    for (const line of lines.slice(destinationIndex + 1, upperBound)) {
      const candidate = sanitizedNameCandidate(line);

      if (isPreferredPosteItalianeRecipient(candidate)) {
        return candidate;
      }

      const normalizedLine = normalizePosteItalianeText(line);
      if (
        normalizedLine.includes("consegna") ||
        normalizedLine.includes("punto poste") ||
        normalizedLine.includes("via ")
      ) {
        break;
      }
    }
  }

  for (const line of lines) {
    const match = line.match(/presso:\s*(.+)$/i);

    if (!match) {
      continue;
    }

    const candidate = sanitizedNameCandidate(match[1] ?? "");
    if (isPreferredPosteItalianeRecipient(candidate)) {
      return candidate;
    }
  }

  const pressoIndex = lines.findIndex((line) => /presso:/i.test(line));
  if (pressoIndex >= 0 && lines[pressoIndex + 1]) {
    const candidate = sanitizedNameCandidate(lines[pressoIndex + 1]);
    if (isPreferredPosteItalianeRecipient(candidate)) {
      return candidate;
    }
  }

  for (const line of lines) {
    const candidate = sanitizedNameCandidate(line);
    const normalizedCandidate = normalizePosteItalianeText(candidate);

    if (
      !candidate ||
      POSTE_ITALIANE_RECIPIENT_SKIP_TOKENS.some((token) =>
        normalizedCandidate.includes(token),
      )
    ) {
      continue;
    }

    if (isPreferredPosteItalianeRecipient(candidate)) {
      return candidate;
    }
  }

  return null;
}

function recipientNameLayout(): RecipientNameLayout {
  const margin = OUTPUT_PAGE_WIDTH * 0.05;

  return {
    x: margin,
    y: OUTPUT_PAGE_HEIGHT - 9 - Math.min(OUTPUT_PAGE_HEIGHT * 0.085, 80),
    width: OUTPUT_PAGE_WIDTH - margin * 2,
    height: Math.min(OUTPUT_PAGE_HEIGHT * 0.085, 80),
    initialFontSize: 20,
  };
}

function inpostItalyRecipientNameLayout(): RecipientNameLayout {
  const margin = OUTPUT_PAGE_WIDTH * 0.075;

  return {
    x: margin,
    y: OUTPUT_PAGE_HEIGHT * 0.045,
    width: OUTPUT_PAGE_WIDTH - margin * 2,
    height: OUTPUT_PAGE_HEIGHT * 0.09,
    initialFontSize: 22,
  };
}

function fittedRecipientFontSize(
  recipientName: string,
  maxWidth: number,
  initialSize: number,
  minimumSize: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
) {
  let size = initialSize;

  while (size > minimumSize) {
    if (font.widthOfTextAtSize(recipientName, size) <= maxWidth) {
      return size;
    }

    size -= 1;
  }

  return Math.max(minimumSize, Math.min(initialSize, size));
}

function extractTextLines(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function isPositionedTextItem(item: unknown): item is PositionedTextItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "str" in item &&
    "transform" in item &&
    typeof item.str === "string" &&
    Array.isArray(item.transform) &&
    typeof item.transform[4] === "number" &&
    typeof item.transform[5] === "number"
  );
}

function positionedTextLinesFromItems(items: unknown[]) {
  const positionedItems = items
    .filter(isPositionedTextItem)
    .map((item) => ({
      text: item.str.trim(),
      x: item.transform[4] ?? 0,
      y: item.transform[5] ?? 0,
    }))
    .filter((item) => item.text);
  const lineGroups: Array<{
    items: Array<{ text: string; x: number }>;
    x: number;
    y: number;
  }> = [];

  for (const item of positionedItems) {
    const lineGroup = lineGroups.find(
      (candidate) => Math.abs(candidate.y - item.y) <= 3,
    );

    if (lineGroup) {
      lineGroup.items.push({ text: item.text, x: item.x });
      lineGroup.x = Math.min(lineGroup.x, item.x);
      continue;
    }

    lineGroups.push({
      items: [{ text: item.text, x: item.x }],
      x: item.x,
      y: item.y,
    });
  }

  return lineGroups.map((lineGroup) => ({
    text: [...lineGroup.items]
      .sort((first, second) => first.x - second.x)
      .map((item) => item.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim(),
    x: lineGroup.x,
    y: lineGroup.y,
  }));
}

function outputPlacementForPreset(
  pageWidth: number,
  pageHeight: number,
  sourcePageRotate: number,
  preset: CropPreset,
  labelType: LabelType,
  horizontalOffset = 0,
  verticalOffset = 0,
) {
  const shouldUseSourceCropOffsets = usesSourceCropOffsets(labelType);
  const cropPreset = presetWithSourceCropOffsets(
    preset,
    labelType,
    horizontalOffset,
    verticalOffset,
  );
  const pageRotate = (sourcePageRotate + cropPreset.rotate) % 360;
  const shouldUseCenteredFullPage = usesCenteredFullPage(labelType);
  const focusCenter = shouldUseCenteredFullPage
    ? {
        x: pageWidth / 2,
        y: pageHeight / 2,
      }
    : {
        x: cropPreset.x + cropPreset.width / 2,
        y: cropPreset.y + cropPreset.height / 2,
      };
  const cropFrame = shouldUseCenteredFullPage
    ? {
        left: 0,
        bottom: 0,
        right: pageWidth,
        top: pageHeight,
      }
    : (() => {
        const sourceScale = Math.max(cropPreset.scale, 0.1);
        const sourceWidth = cropPreset.width / sourceScale;
        const sourceHeight = cropPreset.height / sourceScale;
        const left = focusCenter.x - sourceWidth / 2;
        const bottom = focusCenter.y - sourceHeight / 2;

        return {
          left,
          bottom,
          right: left + sourceWidth,
          top: bottom + sourceHeight,
        };
      })();
  const embeddedRegion = {
    left: clampValue(cropFrame.left, 0, pageWidth),
    bottom: clampValue(cropFrame.bottom, 0, pageHeight),
    right: clampValue(cropFrame.right, 0, pageWidth),
    top: clampValue(cropFrame.top, 0, pageHeight),
  };
  const focusWidth = cropFrame.right - cropFrame.left;
  const focusHeight = cropFrame.top - cropFrame.bottom;
  const embeddedFocusCenter = {
    x: focusCenter.x - embeddedRegion.left,
    y: focusCenter.y - embeddedRegion.bottom,
  };
  const rotatedFocusWidth =
    pageRotate === 90 || pageRotate === 270 ? focusHeight : focusWidth;
  const rotatedFocusHeight =
    pageRotate === 90 || pageRotate === 270 ? focusWidth : focusHeight;
  const fitScale =
    Math.min(
      OUTPUT_PAGE_WIDTH / rotatedFocusWidth,
      OUTPUT_PAGE_HEIGHT / rotatedFocusHeight,
    ) * (shouldUseCenteredFullPage ? cropPreset.scale : 1);
  const targetCenter = {
    x:
      OUTPUT_PAGE_WIDTH / 2 +
      (shouldUseSourceCropOffsets ? 0 : horizontalOffset),
    y:
      OUTPUT_PAGE_HEIGHT / 2 -
      (shouldUseSourceCropOffsets ? 0 : verticalOffset),
  };
  const positionedPage = (() => {
    switch (pageRotate) {
      case 90:
        return {
          x: targetCenter.x + embeddedFocusCenter.y * fitScale,
          y: targetCenter.y - embeddedFocusCenter.x * fitScale,
        };
      case 180:
        return {
          x: targetCenter.x + embeddedFocusCenter.x * fitScale,
          y: targetCenter.y + embeddedFocusCenter.y * fitScale,
        };
      case 270:
        return {
          x: targetCenter.x - embeddedFocusCenter.y * fitScale,
          y: targetCenter.y + embeddedFocusCenter.x * fitScale,
        };
      default:
        return {
          x: targetCenter.x - embeddedFocusCenter.x * fitScale,
          y: targetCenter.y - embeddedFocusCenter.y * fitScale,
        };
    }
  })();

  return {
    embeddedRegion,
    fitScale,
    pageRotate,
    positionedPage,
  };
}

function outputPointForSourcePoint(
  point: { x: number; y: number },
  placement: ReturnType<typeof outputPlacementForPreset>,
) {
  const localPoint = {
    x: point.x - placement.embeddedRegion.left,
    y: point.y - placement.embeddedRegion.bottom,
  };

  switch (placement.pageRotate) {
    case 90:
      return {
        x: placement.positionedPage.x - localPoint.y * placement.fitScale,
        y: placement.positionedPage.y + localPoint.x * placement.fitScale,
      };
    case 180:
      return {
        x: placement.positionedPage.x - localPoint.x * placement.fitScale,
        y: placement.positionedPage.y - localPoint.y * placement.fitScale,
      };
    case 270:
      return {
        x: placement.positionedPage.x + localPoint.y * placement.fitScale,
        y: placement.positionedPage.y - localPoint.x * placement.fitScale,
      };
    default:
      return {
        x: placement.positionedPage.x + localPoint.x * placement.fitScale,
        y: placement.positionedPage.y + localPoint.y * placement.fitScale,
      };
  }
}

function sourcePointForOutputPoint(
  point: { x: number; y: number },
  placement: ReturnType<typeof outputPlacementForPreset>,
) {
  const outputPoint = {
    x: point.x - placement.positionedPage.x,
    y: point.y - placement.positionedPage.y,
  };

  switch (placement.pageRotate) {
    case 90:
      return {
        x: outputPoint.y / placement.fitScale + placement.embeddedRegion.left,
        y:
          -outputPoint.x / placement.fitScale + placement.embeddedRegion.bottom,
      };
    case 180:
      return {
        x: -outputPoint.x / placement.fitScale + placement.embeddedRegion.left,
        y:
          -outputPoint.y / placement.fitScale + placement.embeddedRegion.bottom,
      };
    case 270:
      return {
        x: -outputPoint.y / placement.fitScale + placement.embeddedRegion.left,
        y: outputPoint.x / placement.fitScale + placement.embeddedRegion.bottom,
      };
    default:
      return {
        x: outputPoint.x / placement.fitScale + placement.embeddedRegion.left,
        y: outputPoint.y / placement.fitScale + placement.embeddedRegion.bottom,
      };
  }
}

function sourceBoundsForOutputRect(
  rect: { x: number; y: number; width: number; height: number },
  placement: ReturnType<typeof outputPlacementForPreset>,
) {
  const points = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ].map((point) => sourcePointForOutputPoint(point, placement));
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  return {
    left: Math.min(...xs),
    bottom: Math.min(...ys),
    right: Math.max(...xs),
    top: Math.max(...ys),
  };
}

function outputRectForSourceBounds(
  bounds: { left: number; bottom: number; right: number; top: number },
  placement: ReturnType<typeof outputPlacementForPreset>,
) {
  const points = [
    { x: bounds.left, y: bounds.bottom },
    { x: bounds.right, y: bounds.bottom },
    { x: bounds.right, y: bounds.top },
    { x: bounds.left, y: bounds.top },
  ].map((point) => outputPointForSourcePoint(point, placement));
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);

  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  };
}

function positionedTextLinesFromItemsInOutputRegion(
  items: unknown[],
  pageWidth: number,
  pageHeight: number,
  sourcePageRotate: number,
  preset: CropPreset,
  labelType: LabelType,
  region: { x: number; y: number; width: number; height: number },
) {
  const placement = outputPlacementForPreset(
    pageWidth,
    pageHeight,
    sourcePageRotate,
    preset,
    labelType,
  );
  const positionedItems = items
    .filter(isPositionedTextItem)
    .map((item) => {
      const outputPoint = outputPointForSourcePoint(
        {
          x: item.transform[4] ?? 0,
          y: item.transform[5] ?? 0,
        },
        placement,
      );
      const regionX = outputPoint.x / OUTPUT_PAGE_WIDTH;
      const regionY = (OUTPUT_PAGE_HEIGHT - outputPoint.y) / OUTPUT_PAGE_HEIGHT;

      return {
        text: item.str.trim(),
        x: outputPoint.x,
        y: outputPoint.y,
        isInRegion:
          regionX >= region.x &&
          regionX <= region.x + region.width &&
          regionY >= region.y &&
          regionY <= region.y + region.height,
      };
    })
    .filter((item) => item.text && item.isInRegion);

  return positionedTextLinesFromItems(
    positionedItems.map((item) => ({
      str: item.text,
      transform: [1, 0, 0, 1, item.x, item.y],
    })),
  );
}

function clampValue(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function clampOffsetValue(value: number, minimum: number, maximum: number) {
  return clampValue(Math.round(value), minimum, maximum);
}

function clampScaleOffsetValue(
  value: number,
  minimum: number,
  maximum: number,
) {
  const roundedValue = Math.round(value * 100) / 100;

  return clampValue(roundedValue, minimum, maximum);
}

function SliderWithDefaultNotch({
  notchValue,
  min,
  max,
  className,
  onPassNotch,
  onValueChange,
  ...props
}: SliderWithDefaultNotchProps) {
  const currentValue = Array.isArray(props.value) ? props.value[0] : undefined;
  const previousValueRef = useRef(currentValue);

  useEffect(() => {
    previousValueRef.current = currentValue;
  }, [currentValue]);

  const handleValueChange = useCallback(
    (nextValue: number[]) => {
      const previousValue = previousValueRef.current;
      const nextSingleValue = nextValue[0];

      if (
        typeof previousValue === "number" &&
        typeof nextSingleValue === "number" &&
        previousValue !== nextSingleValue
      ) {
        const previousDelta = previousValue - notchValue;
        const nextDelta = nextSingleValue - notchValue;
        const reachedOrCrossedNotch =
          Math.abs(previousDelta) > 0.0001 && previousDelta * nextDelta <= 0;

        if (reachedOrCrossedNotch) {
          onPassNotch?.();
        }
      }

      previousValueRef.current = nextSingleValue;
      onValueChange?.(nextValue);
    },
    [notchValue, onPassNotch, onValueChange],
  );

  if (typeof min !== "number" || typeof max !== "number" || min === max) {
    return (
      <Slider
        className={className}
        min={min}
        max={max}
        onValueChange={handleValueChange}
        {...props}
      />
    );
  }

  const notchPercent = ((notchValue - min) / (max - min)) * 100;
  const shouldShowNotch =
    typeof currentValue !== "number" ||
    Math.abs(currentValue - notchValue) > 0.0001;

  return (
    <Slider
      className={className}
      min={min}
      max={max}
      notchPercent={shouldShowNotch ? notchPercent : undefined}
      onValueChange={handleValueChange}
      {...props}
    />
  );
}

type PdfWorkbenchProps = {
  locale: WebLocale;
  messages: ReturnType<typeof getWebMessages>["workbench"];
};

export default function PdfWorkbench({ messages }: PdfWorkbenchProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const importUrlInputRef = useRef<HTMLInputElement | null>(null);
  const autoImportedUrlRef = useRef<string | null>(null);
  const previewFrameRef = useRef<HTMLDivElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const ocrWorkerRef = useRef<TesseractWorker | null>(null);
  const recipientNameCacheRef = useRef<Map<string, string | null>>(new Map());
  const labelDetectionCacheRef = useRef<Map<string, DetectedLabel | null>>(
    new Map(),
  );
  const fileSelectionVersionRef = useRef(0);
  const cropRequestVersionRef = useRef(0);
  const dragDepthRef = useRef(0);
  const hasStoredUseHalfPageBrtPreferenceRef = useRef(false);
  const previewPanRef = useRef<{
    frameHeight: number;
    frameWidth: number;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [labelType, setLabelType] = useState<LabelType>("posteItaliane");
  const [useHalfPageBRT, setUseHalfPageBRT] = useState(
    DEFAULT_USE_HALF_PAGE_BRT,
  );
  const [showRecipientName, setShowRecipientName] = useState(
    DEFAULT_SHOW_RECIPIENT_NAME,
  );
  const [showVintedGoRecipientName, setShowVintedGoRecipientName] = useState(
    DEFAULT_SHOW_VINTED_GO_RECIPIENT_NAME,
  );
  const [showInpostFamilyRecipientName, setShowInpostFamilyRecipientName] =
    useState(DEFAULT_SHOW_INPOST_FAMILY_RECIPIENT_NAME);
  const [showInpostItalyRecipientName, setShowInpostItalyRecipientName] =
    useState(DEFAULT_SHOW_INPOST_ITALY_RECIPIENT_NAME);
  const [hidePosteItalianeSenderAddress, setHidePosteItalianeSenderAddress] =
    useState(DEFAULT_HIDE_POSTE_ITALIANE_SENDER_ADDRESS);
  const [hideVintedGoSenderAddress, setHideVintedGoSenderAddress] = useState(
    DEFAULT_HIDE_VINTED_GO_SENDER_ADDRESS,
  );
  const [hideInpostItalySenderAddress, setHideInpostItalySenderAddress] =
    useState(DEFAULT_HIDE_INPOST_ITALY_SENDER_ADDRESS);
  const [recipientNameFontSize, setRecipientNameFontSize] = useState(
    DEFAULT_RECIPIENT_NAME_FONT_SIZE,
  );
  const [hasLoadedControlPreferences, setHasLoadedControlPreferences] =
    useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scaleOffset, setScaleOffset] = useState(0);
  const [rotationOffset, setRotationOffset] = useState(0);
  const [pdfUrl, setPdfUrl] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [previewFrameWidth, setPreviewFrameWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewPanning, setIsPreviewPanning] = useState(false);
  const controlsDisabled = file === null;
  const { trigger } = useWebHaptics();
  const selectedShowRecipientName =
    labelType === "inpostItaly"
      ? showInpostItalyRecipientName
      : labelType === "inpostFamily"
        ? showInpostFamilyRecipientName
        : labelType === "vintedGo"
          ? showVintedGoRecipientName
          : showRecipientName;

  const basePreset = useMemo(
    () => initialPreset(labelType, useHalfPageBRT),
    [labelType, useHalfPageBRT],
  );
  const localizedLabelOptions = useMemo(
    () =>
      LABEL_OPTIONS.map((option) => ({
        value: option.value,
        label: messages.labelOptions[option.value],
      })),
    [messages.labelOptions],
  );
  const runCropPdf = useEffectEvent(
    (
      nextFile: File,
      nextPreset: CropPreset,
      horizontalOffset: number,
      verticalOffset: number,
      nextLabelType: LabelType,
      nextShowRecipientName: boolean,
      nextShowVintedGoRecipientName: boolean,
      nextShowInpostFamilyRecipientName: boolean,
      nextShowInpostItalyRecipientName: boolean,
      nextHidePosteItalianeSenderAddress: boolean,
      nextHideVintedGoSenderAddress: boolean,
      nextHideInpostItalySenderAddress: boolean,
    ) => {
      void cropPdf(
        nextFile,
        nextPreset,
        horizontalOffset,
        verticalOffset,
        nextLabelType,
        nextShowRecipientName,
        nextShowVintedGoRecipientName,
        nextShowInpostFamilyRecipientName,
        nextShowInpostItalyRecipientName,
        nextHidePosteItalianeSenderAddress,
        nextHideVintedGoSenderAddress,
        nextHideInpostItalySenderAddress,
      );
    },
  );
  const handlePreviewWheelEvent = useEffectEvent((event: WheelEvent) => {
    if (labelType !== "manualEditor" || !file) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const deltaMultiplier =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? (previewFrameRef.current?.clientHeight ?? 0)
          : 1;
    const normalizedDelta = event.deltaY * deltaMultiplier;
    const nextScaleOffset = clampScaleOffsetValue(
      scaleOffset - normalizedDelta / 1600,
      MANUAL_SCALE_OFFSET_MIN,
      MANUAL_SCALE_OFFSET_MAX,
    );

    if (nextScaleOffset === scaleOffset) {
      return;
    }

    updateScaleOffset(nextScaleOffset);
  });
  const isImportUrlValid = useMemo(() => {
    const trimmedUrl = importUrl.trim();

    if (!trimmedUrl) {
      return false;
    }

    try {
      new URL(trimmedUrl);
      return true;
    } catch {
      return false;
    }
  }, [importUrl]);

  const preset = useMemo<CropPreset>(() => {
    const nextRotate =
      (((basePreset.rotate - rotationOffset) % 360) + 360) % 360;

    return {
      ...basePreset,
      rotate: nextRotate,
      scale: Math.max(0.2, basePreset.scale + scaleOffset),
    };
  }, [basePreset, rotationOffset, scaleOffset]);
  const offsetBounds =
    labelType === "manualEditor"
      ? { min: MANUAL_OFFSET_MIN, max: MANUAL_OFFSET_MAX }
      : { min: DEFAULT_OFFSET_MIN, max: DEFAULT_OFFSET_MAX };
  const scaleOffsetBounds =
    labelType === "manualEditor"
      ? { min: MANUAL_SCALE_OFFSET_MIN, max: MANUAL_SCALE_OFFSET_MAX }
      : { min: DEFAULT_SCALE_OFFSET_MIN, max: DEFAULT_SCALE_OFFSET_MAX };
  const previewCursorStyle =
    labelType === "manualEditor"
      ? ({
          WebkitCursor: isPreviewPanning ? "grabbing" : "grab",
          cursor: isPreviewPanning ? "grabbing" : "grab",
        } as CSSProperties)
      : undefined;

  const previewCanvasWidth =
    previewFrameWidth > 4 ? previewFrameWidth - 4 : undefined;

  useEffect(() => {
    importUrlInputRef.current?.focus();
  }, []);

  const runAutoImportFromUrl = useEffectEvent((rawUrl: string) => {
    void importPdfFromUrl(rawUrl);
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const nextImportUrl = searchParams.get(AUTO_IMPORT_QUERY_PARAM)?.trim();

    if (!nextImportUrl || autoImportedUrlRef.current === nextImportUrl) {
      return;
    }

    autoImportedUrlRef.current = nextImportUrl;
    setImportUrl(nextImportUrl);
    searchParams.delete(AUTO_IMPORT_QUERY_PARAM);

    const nextSearch = searchParams.toString();
    const nextUrl = `${window.location.pathname}${
      nextSearch ? `?${nextSearch}` : ""
    }${window.location.hash}`;

    window.history.replaceState(null, "", nextUrl);
    runAutoImportFromUrl(nextImportUrl);
  }, []);

  useEffect(() => {
    setOffsetX(0);
    setOffsetY(0);
    setScaleOffset(0);
    setRotationOffset(0);
  }, [basePreset]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    function isWithinDropZone(target: EventTarget | null) {
      return target instanceof Node && dropZoneRef.current?.contains(target);
    }

    function preventWindowFileDrop(event: DragEvent) {
      if (!dataTransferHasFiles(event.dataTransfer)) {
        return;
      }

      if (event.type === "dragover") {
        event.dataTransfer!.dropEffect = isWithinDropZone(event.target)
          ? "copy"
          : "none";
      }

      if (isWithinDropZone(event.target)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current = 0;
      setIsDragging(false);
    }

    window.addEventListener("dragover", preventWindowFileDrop, true);
    window.addEventListener("drop", preventWindowFileDrop, true);

    return () => {
      window.removeEventListener("dragover", preventWindowFileDrop, true);
      window.removeEventListener("drop", preventWindowFileDrop, true);
    };
  }, []);

  useEffect(() => {
    return () => {
      const worker = ocrWorkerRef.current;

      if (worker) {
        void worker.terminate();
        ocrWorkerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const storedUseHalfPageBrtPreference = readStoredUseHalfPageBrtPreference();

    hasStoredUseHalfPageBrtPreferenceRef.current =
      storedUseHalfPageBrtPreference.hasStoredValue;
    setUseHalfPageBRT(storedUseHalfPageBrtPreference.value);
    setShowRecipientName(getStoredShowRecipientNamePreference());
    setShowVintedGoRecipientName(
      getStoredShowVintedGoRecipientNamePreference(),
    );
    setShowInpostFamilyRecipientName(
      getStoredShowInpostFamilyRecipientNamePreference(),
    );
    setShowInpostItalyRecipientName(
      getStoredShowInpostItalyRecipientNamePreference(),
    );
    setHidePosteItalianeSenderAddress(
      getStoredHidePosteItalianeSenderAddressPreference(),
    );
    setHideVintedGoSenderAddress(
      getStoredHideVintedGoSenderAddressPreference(),
    );
    setHideInpostItalySenderAddress(
      getStoredHideInpostItalySenderAddressPreference(),
    );
    setRecipientNameFontSize(getStoredRecipientNameFontSizePreference());
    setHasLoadedControlPreferences(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedControlPreferences) {
      return;
    }

    try {
      if (useHalfPageBRT === DEFAULT_USE_HALF_PAGE_BRT) {
        hasStoredUseHalfPageBrtPreferenceRef.current = false;
        window.localStorage.removeItem(USE_HALF_PAGE_BRT_STORAGE_KEY);
      } else {
        hasStoredUseHalfPageBrtPreferenceRef.current = true;
        window.localStorage.setItem(
          USE_HALF_PAGE_BRT_STORAGE_KEY,
          String(useHalfPageBRT),
        );
      }
    } catch {
      // Ignore persistence failures and keep current session state.
    }
  }, [hasLoadedControlPreferences, useHalfPageBRT]);

  useEffect(() => {
    if (!hasLoadedControlPreferences) {
      return;
    }

    try {
      if (showRecipientName === DEFAULT_SHOW_RECIPIENT_NAME) {
        window.localStorage.removeItem(SHOW_RECIPIENT_NAME_STORAGE_KEY);
      } else {
        window.localStorage.setItem(
          SHOW_RECIPIENT_NAME_STORAGE_KEY,
          String(showRecipientName),
        );
      }
    } catch {
      // Ignore persistence failures and keep current session state.
    }
  }, [hasLoadedControlPreferences, showRecipientName]);

  useEffect(() => {
    if (!hasLoadedControlPreferences) {
      return;
    }

    try {
      if (showVintedGoRecipientName === DEFAULT_SHOW_VINTED_GO_RECIPIENT_NAME) {
        window.localStorage.removeItem(
          SHOW_VINTED_GO_RECIPIENT_NAME_STORAGE_KEY,
        );
      } else {
        window.localStorage.setItem(
          SHOW_VINTED_GO_RECIPIENT_NAME_STORAGE_KEY,
          String(showVintedGoRecipientName),
        );
      }
    } catch {
      // Ignore persistence failures and keep current session state.
    }
  }, [hasLoadedControlPreferences, showVintedGoRecipientName]);

  useEffect(() => {
    if (!hasLoadedControlPreferences) {
      return;
    }

    try {
      if (
        showInpostFamilyRecipientName ===
        DEFAULT_SHOW_INPOST_FAMILY_RECIPIENT_NAME
      ) {
        window.localStorage.removeItem(
          SHOW_INPOST_FAMILY_RECIPIENT_NAME_STORAGE_KEY,
        );
      } else {
        window.localStorage.setItem(
          SHOW_INPOST_FAMILY_RECIPIENT_NAME_STORAGE_KEY,
          String(showInpostFamilyRecipientName),
        );
      }
    } catch {
      // Ignore persistence failures and keep current session state.
    }
  }, [hasLoadedControlPreferences, showInpostFamilyRecipientName]);

  useEffect(() => {
    if (!hasLoadedControlPreferences) {
      return;
    }

    try {
      if (
        showInpostItalyRecipientName ===
        DEFAULT_SHOW_INPOST_ITALY_RECIPIENT_NAME
      ) {
        window.localStorage.removeItem(
          SHOW_INPOST_ITALY_RECIPIENT_NAME_STORAGE_KEY,
        );
      } else {
        window.localStorage.setItem(
          SHOW_INPOST_ITALY_RECIPIENT_NAME_STORAGE_KEY,
          String(showInpostItalyRecipientName),
        );
      }
    } catch {
      // Ignore persistence failures and keep current session state.
    }
  }, [hasLoadedControlPreferences, showInpostItalyRecipientName]);

  useEffect(() => {
    if (!hasLoadedControlPreferences) {
      return;
    }

    try {
      if (
        hidePosteItalianeSenderAddress ===
        DEFAULT_HIDE_POSTE_ITALIANE_SENDER_ADDRESS
      ) {
        window.localStorage.removeItem(
          HIDE_POSTE_ITALIANE_SENDER_ADDRESS_STORAGE_KEY,
        );
      } else {
        window.localStorage.setItem(
          HIDE_POSTE_ITALIANE_SENDER_ADDRESS_STORAGE_KEY,
          String(hidePosteItalianeSenderAddress),
        );
      }
    } catch {
      // Ignore persistence failures and keep current session state.
    }
  }, [hasLoadedControlPreferences, hidePosteItalianeSenderAddress]);

  useEffect(() => {
    if (!hasLoadedControlPreferences) {
      return;
    }

    try {
      if (hideVintedGoSenderAddress === DEFAULT_HIDE_VINTED_GO_SENDER_ADDRESS) {
        window.localStorage.removeItem(
          HIDE_VINTED_GO_SENDER_ADDRESS_STORAGE_KEY,
        );
      } else {
        window.localStorage.setItem(
          HIDE_VINTED_GO_SENDER_ADDRESS_STORAGE_KEY,
          String(hideVintedGoSenderAddress),
        );
      }
    } catch {
      // Ignore persistence failures and keep current session state.
    }
  }, [hasLoadedControlPreferences, hideVintedGoSenderAddress]);

  useEffect(() => {
    if (!hasLoadedControlPreferences) {
      return;
    }

    try {
      if (
        hideInpostItalySenderAddress ===
        DEFAULT_HIDE_INPOST_ITALY_SENDER_ADDRESS
      ) {
        window.localStorage.removeItem(
          HIDE_INPOST_ITALY_SENDER_ADDRESS_STORAGE_KEY,
        );
      } else {
        window.localStorage.setItem(
          HIDE_INPOST_ITALY_SENDER_ADDRESS_STORAGE_KEY,
          String(hideInpostItalySenderAddress),
        );
      }
    } catch {
      // Ignore persistence failures and keep current session state.
    }
  }, [hasLoadedControlPreferences, hideInpostItalySenderAddress]);

  useEffect(() => {
    if (!hasLoadedControlPreferences) {
      return;
    }

    try {
      if (recipientNameFontSize === DEFAULT_RECIPIENT_NAME_FONT_SIZE) {
        window.localStorage.removeItem(RECIPIENT_NAME_FONT_SIZE_STORAGE_KEY);
      } else {
        window.localStorage.setItem(
          RECIPIENT_NAME_FONT_SIZE_STORAGE_KEY,
          String(recipientNameFontSize),
        );
      }
    } catch {
      // Ignore persistence failures and keep current session state.
    }
  }, [hasLoadedControlPreferences, recipientNameFontSize]);

  useEffect(() => {
    if (!file) {
      return;
    }

    runCropPdf(
      file,
      preset,
      offsetX,
      offsetY,
      labelType,
      showRecipientName,
      showVintedGoRecipientName,
      showInpostFamilyRecipientName,
      showInpostItalyRecipientName,
      hidePosteItalianeSenderAddress,
      hideVintedGoSenderAddress,
      hideInpostItalySenderAddress,
    );
  }, [
    file,
    hidePosteItalianeSenderAddress,
    hideVintedGoSenderAddress,
    hideInpostItalySenderAddress,
    labelType,
    offsetX,
    offsetY,
    preset,
    recipientNameFontSize,
    showInpostFamilyRecipientName,
    showInpostItalyRecipientName,
    showRecipientName,
    showVintedGoRecipientName,
  ]);

  useEffect(() => {
    previewPanRef.current = null;
    setIsPreviewPanning(false);
  }, [file, labelType]);

  useEffect(() => {
    const element = previewFrameRef.current;

    if (!element) {
      return;
    }

    const updateFrameWidth = () =>
      setPreviewFrameWidth(Math.floor(element.clientWidth));

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry) {
        setPreviewFrameWidth(Math.floor(entry.contentRect.width));
      }
    });

    updateFrameWidth();
    observer.observe(element);

    return () => observer.disconnect();
  }, [pdfUrl]);

  useEffect(() => {
    const element = previewFrameRef.current;

    if (!element) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      handlePreviewWheelEvent(event);
    };

    element.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      element.removeEventListener("wheel", onWheel);
    };
  }, [pdfUrl]);

  function openFileDialog() {
    inputRef.current?.click();
  }

  function isPdfFile(nextFile: File) {
    return (
      nextFile.type === "application/pdf" ||
      nextFile.name.toLowerCase().endsWith(".pdf")
    );
  }

  function dataTransferHasFiles(dataTransfer: DataTransfer | null) {
    if (!dataTransfer) {
      return false;
    }

    if (Array.from(dataTransfer.types).includes("Files")) {
      return true;
    }

    if (dataTransfer.items.length > 0) {
      return Array.from(dataTransfer.items).some(
        (item) => item.kind === "file",
      );
    }

    return dataTransfer.files.length > 0;
  }

  function getDroppedFile(dataTransfer: DataTransfer | null) {
    if (!dataTransfer) {
      return null;
    }

    if (dataTransfer.files.length > 0) {
      return dataTransfer.files[0] ?? null;
    }

    return (
      Array.from(dataTransfer.items)
        .find((item) => item.kind === "file")
        ?.getAsFile() ?? null
    );
  }

  function handleDragEnter(event: React.DragEvent<HTMLDivElement>) {
    if (!dataTransferHasFiles(event.dataTransfer)) {
      return;
    }

    dragDepthRef.current += 1;
    setIsDragging(true);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (!dataTransferHasFiles(event.dataTransfer)) {
      if (isDragging) {
        dragDepthRef.current = 0;
        setIsDragging(false);
      }
      return;
    }

    event.preventDefault();

    if (!isDragging) {
      setIsDragging(true);
    }
  }

  function handleDragLeave() {
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);

    if (!dataTransferHasFiles(event.dataTransfer)) {
      return;
    }

    handleSelectedFile(getDroppedFile(event.dataTransfer));
  }

  function clearSelectedPdf() {
    fileSelectionVersionRef.current += 1;
    previewPanRef.current = null;
    setIsPreviewPanning(false);
    setFile(null);
    setImportUrl("");
    setPdfUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return "";
    });

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleSelectedFile(nextFile: File | null) {
    if (!nextFile) {
      return;
    }

    if (!isPdfFile(nextFile)) {
      toast.error(messages.errors.choosePdf);
      return;
    }

    recipientNameCacheRef.current.clear();
    labelDetectionCacheRef.current.clear();
    fileSelectionVersionRef.current += 1;
    const selectionVersion = fileSelectionVersionRef.current;

    setLabelType(DEFAULT_LABEL_TYPE);
    setFile(nextFile);

    void detectImportedLabelType(nextFile).then((detectedLabel) => {
      if (fileSelectionVersionRef.current !== selectionVersion) {
        return;
      }

      if (!detectedLabel) {
        setLabelType(DEFAULT_LABEL_TYPE);
        return;
      }

      setLabelType(detectedLabel.labelType);

      if (
        detectedLabel.labelType === "brt" &&
        !hasStoredUseHalfPageBrtPreferenceRef.current
      ) {
        setUseHalfPageBRT(detectedLabel.useHalfPageBRT ?? true);
      }
    });
  }

  async function handleImportFromUrl() {
    await importPdfFromUrl(importUrl);
  }

  async function importPdfFromUrl(rawUrl: string) {
    const trimmedUrl = rawUrl.trim();

    if (!trimmedUrl) {
      toast.error(messages.errors.enterPdfUrl);
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      toast.error(messages.errors.enterValidUrl);
      return;
    }

    setIsImportingUrl(true);

    try {
      const response = await fetch("/api/import-from-url", {
        body: JSON.stringify({ url: parsedUrl.toString() }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(messages.errors.fetchPdfUrl);
      }

      const blob = await response.blob();
      const contentType = response.headers.get("content-type") ?? blob.type;
      const urlPath = parsedUrl.pathname.toLowerCase();
      const looksLikePdf =
        contentType.includes("pdf") || urlPath.endsWith(".pdf");

      if (!looksLikePdf) {
        throw new Error(messages.errors.urlNotPdf);
      }

      const fileNameFromUrl =
        getFileNameFromContentDisposition(
          response.headers.get("content-disposition"),
        ) ??
        parsedUrl.pathname.split("/").filter(Boolean).pop() ??
        "remote-label.pdf";
      const normalizedFileName = fileNameFromUrl.toLowerCase().endsWith(".pdf")
        ? fileNameFromUrl
        : `${fileNameFromUrl}.pdf`;
      const importedFile = new File([blob], normalizedFileName, {
        type: "application/pdf",
      });

      handleSelectedFile(importedFile);
    } catch (importError) {
      const message =
        importError instanceof Error
          ? importError.message
          : messages.errors.importFailed;
      toast.error(message);
    } finally {
      setIsImportingUrl(false);
    }
  }

  function handlePrint() {
    if (!pdfUrl) {
      return;
    }

    const printWindow = window.open(pdfUrl, "_blank", "noopener,noreferrer");
    printWindow?.focus();
  }

  function updateRecipientNameFontSize(nextValue: number) {
    setRecipientNameFontSize(clampRecipientNameFontSize(nextValue));
  }

  function triggerSelectionHaptic() {
    void trigger("selection");
  }

  function fileCacheKey(nextFile: File) {
    return `${nextFile.name}:${nextFile.size}:${nextFile.lastModified}`;
  }

  async function getOcrWorker() {
    if (ocrWorkerRef.current) {
      return ocrWorkerRef.current;
    }

    const worker = await createWorker(["ita", "eng"], 1, {
      logger: () => undefined,
      errorHandler: () => undefined,
    });

    await worker.setParameters({
      tessedit_pageseg_mode: "6" as PSM,
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });

    ocrWorkerRef.current = worker;
    return worker;
  }

  async function detectImportedLabelType(nextFile: File) {
    const cacheKey = fileCacheKey(nextFile);
    const cachedLabel = labelDetectionCacheRef.current.get(cacheKey);

    if (cachedLabel !== undefined) {
      return cachedLabel;
    }

    const arrayBuffer = await nextFile.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;

    try {
      const firstPage = await pdf.getPage(1);
      const textContent = await firstPage.getTextContent();
      const pdfText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join("\n");
      const baseViewport = firstPage.getViewport({ scale: 1 });
      const textMatch = detectLabelFromExtractedText(
        pdfText,
        baseViewport.width,
        baseViewport.height,
      );

      if (textMatch && textMatch.labelType !== "posteItaliane") {
        labelDetectionCacheRef.current.set(cacheKey, textMatch);
        return textMatch;
      }

      const scale = 2.2;
      const viewport = firstPage.getViewport({ scale });
      const renderedCanvas = document.createElement("canvas");
      renderedCanvas.width = Math.ceil(viewport.width);
      renderedCanvas.height = Math.ceil(viewport.height);

      const context = renderedCanvas.getContext("2d");

      if (!context) {
        labelDetectionCacheRef.current.set(cacheKey, null);
        return null;
      }

      await firstPage.render({
        canvas: renderedCanvas,
        canvasContext: context,
        viewport,
      }).promise;

      const worker = await getOcrWorker();
      const { data } = await worker.recognize(renderedCanvas);
      const ocrMatch = detectLabelFromExtractedText(
        data.text,
        baseViewport.width,
        baseViewport.height,
      );

      if (ocrMatch?.labelType === "vintedGo") {
        labelDetectionCacheRef.current.set(cacheKey, ocrMatch);
        return ocrMatch;
      }

      if (ocrMatch?.labelType === "inpostItaly") {
        labelDetectionCacheRef.current.set(cacheKey, ocrMatch);
        return ocrMatch;
      }

      const inpostRegionCanvas = cropCanvasRegion(
        renderedCanvas,
        INPOST_LOGO_REGION,
      );

      if (inpostRegionCanvas) {
        const inpostRegionResult = await worker.recognize(inpostRegionCanvas);
        const inpostRegionText = normalizeDetectedText(
          inpostRegionResult.data.text,
        );

        if (
          inpostRegionText.includes("inpost") ||
          inpostRegionText.includes("mondial relay") ||
          inpostRegionText.includes("mondialrelay")
        ) {
          const inpostMatch: DetectedLabel = { labelType: "inpostFamily" };
          labelDetectionCacheRef.current.set(cacheKey, inpostMatch);
          return inpostMatch;
        }
      }

      const fallbackMatch = ocrMatch ?? textMatch;
      labelDetectionCacheRef.current.set(cacheKey, fallbackMatch);
      return fallbackMatch;
    } catch {
      labelDetectionCacheRef.current.set(cacheKey, null);
      return null;
    } finally {
      pdf.destroy();
    }
  }

  async function extractPosteItalianeRecipientName(
    nextFile: File,
    nextPreset: CropPreset,
    cacheLabelType: Extract<
      LabelType,
      "posteItaliane" | "vintedGo"
    > = "posteItaliane",
  ) {
    const cacheKey = `${cacheLabelType}:${fileCacheKey(nextFile)}`;
    const cachedRecipientName = recipientNameCacheRef.current.get(cacheKey);

    if (cachedRecipientName !== undefined) {
      return cachedRecipientName;
    }

    const arrayBuffer = await nextFile.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;

    try {
      const firstPage = await pdf.getPage(1);
      const textContent = await firstPage.getTextContent();
      const pdfText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join("\n");
      const textRecipientName = extractPosteItalianeRecipientFromTextLines(
        extractTextLines(pdfText),
      );

      if (textRecipientName) {
        recipientNameCacheRef.current.set(cacheKey, textRecipientName);
        return textRecipientName;
      }

      const scale = 2.5;
      const viewport = firstPage.getViewport({ scale });
      const renderedCanvas = document.createElement("canvas");
      renderedCanvas.width = Math.ceil(viewport.width);
      renderedCanvas.height = Math.ceil(viewport.height);

      const context = renderedCanvas.getContext("2d");

      if (!context) {
        recipientNameCacheRef.current.set(cacheKey, null);
        return null;
      }

      await firstPage.render({
        canvas: renderedCanvas,
        canvasContext: context,
        viewport,
      }).promise;

      const cropCanvas = document.createElement("canvas");
      const cropWidth = Math.round(
        (nextPreset.width / Math.max(nextPreset.scale, 0.1)) * scale,
      );
      const cropHeight = Math.round(
        (nextPreset.height / Math.max(nextPreset.scale, 0.1)) * scale,
      );
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;

      const cropContext = cropCanvas.getContext("2d");

      if (!cropContext) {
        recipientNameCacheRef.current.set(cacheKey, null);
        return null;
      }

      const sourceX = (nextPreset.x / Math.max(nextPreset.scale, 0.1)) * scale;
      const sourceY =
        renderedCanvas.height -
        ((nextPreset.y + nextPreset.height) / Math.max(nextPreset.scale, 0.1)) *
          scale;

      cropContext.drawImage(
        renderedCanvas,
        sourceX,
        sourceY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );

      const rotatedCanvas = document.createElement("canvas");
      const rotate = ((nextPreset.rotate % 360) + 360) % 360;
      const isQuarterTurn = rotate === 90 || rotate === 270;
      rotatedCanvas.width = isQuarterTurn
        ? cropCanvas.height
        : cropCanvas.width;
      rotatedCanvas.height = isQuarterTurn
        ? cropCanvas.width
        : cropCanvas.height;
      const rotatedContext = rotatedCanvas.getContext("2d");

      if (!rotatedContext) {
        recipientNameCacheRef.current.set(cacheKey, null);
        return null;
      }

      rotatedContext.fillStyle = "#ffffff";
      rotatedContext.fillRect(0, 0, rotatedCanvas.width, rotatedCanvas.height);
      rotatedContext.translate(
        rotatedCanvas.width / 2,
        rotatedCanvas.height / 2,
      );
      rotatedContext.rotate((rotate * Math.PI) / 180);
      rotatedContext.drawImage(
        cropCanvas,
        -cropCanvas.width / 2,
        -cropCanvas.height / 2,
      );

      const recipientRegionCanvas = document.createElement("canvas");
      recipientRegionCanvas.width = Math.round(
        rotatedCanvas.width * POSTE_ITALIANE_RECIPIENT_REGION.width,
      );
      recipientRegionCanvas.height = Math.round(
        rotatedCanvas.height * POSTE_ITALIANE_RECIPIENT_REGION.height,
      );
      const recipientRegionContext = recipientRegionCanvas.getContext("2d");

      if (!recipientRegionContext) {
        recipientNameCacheRef.current.set(cacheKey, null);
        return null;
      }

      recipientRegionContext.fillStyle = "#ffffff";
      recipientRegionContext.fillRect(
        0,
        0,
        recipientRegionCanvas.width,
        recipientRegionCanvas.height,
      );
      recipientRegionContext.drawImage(
        rotatedCanvas,
        rotatedCanvas.width * POSTE_ITALIANE_RECIPIENT_REGION.x,
        rotatedCanvas.height * POSTE_ITALIANE_RECIPIENT_REGION.y,
        recipientRegionCanvas.width,
        recipientRegionCanvas.height,
        0,
        0,
        recipientRegionCanvas.width,
        recipientRegionCanvas.height,
      );

      const worker = await getOcrWorker();
      const { data } = await worker.recognize(recipientRegionCanvas);
      const recipientName = extractPosteItalianeRecipientFromTextLines(
        extractTextLines(data.text),
      );

      recipientNameCacheRef.current.set(cacheKey, recipientName);
      return recipientName;
    } finally {
      pdf.destroy();
    }
  }

  async function extractInpostFamilyRecipientName(
    nextFile: File,
    nextPreset: CropPreset,
  ) {
    const cacheKey = `inpostFamily:${fileCacheKey(nextFile)}`;
    const cachedRecipientName = recipientNameCacheRef.current.get(cacheKey);

    if (cachedRecipientName !== undefined) {
      return cachedRecipientName;
    }

    const arrayBuffer = await nextFile.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;

    try {
      const firstPage = await pdf.getPage(1);
      const textContent = await firstPage.getTextContent();
      const viewport = firstPage.getViewport({ scale: 1 });
      const textRecipientName = extractInpostFamilyRecipientFromTextLines(
        positionedTextLinesFromItemsInOutputRegion(
          textContent.items,
          viewport.width,
          viewport.height,
          firstPage.rotate,
          nextPreset,
          "inpostFamily",
          INPOST_FAMILY_RECIPIENT_REGION,
        )
          .sort((first, second) => second.y - first.y || first.x - second.x)
          .map((line) => line.text),
      );

      if (textRecipientName) {
        recipientNameCacheRef.current.set(cacheKey, textRecipientName);
        return textRecipientName;
      }

      const scale = 2.5;
      const ocrViewport = firstPage.getViewport({ scale });
      const renderedCanvas = document.createElement("canvas");
      renderedCanvas.width = Math.ceil(ocrViewport.width);
      renderedCanvas.height = Math.ceil(ocrViewport.height);

      const context = renderedCanvas.getContext("2d");

      if (!context) {
        recipientNameCacheRef.current.set(cacheKey, null);
        return null;
      }

      await firstPage.render({
        canvas: renderedCanvas,
        canvasContext: context,
        viewport: ocrViewport,
      }).promise;

      const cropCanvas = document.createElement("canvas");
      const cropWidth = Math.round(
        (nextPreset.width / Math.max(nextPreset.scale, 0.1)) * scale,
      );
      const cropHeight = Math.round(
        (nextPreset.height / Math.max(nextPreset.scale, 0.1)) * scale,
      );
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;

      const cropContext = cropCanvas.getContext("2d");

      if (!cropContext) {
        recipientNameCacheRef.current.set(cacheKey, null);
        return null;
      }

      const sourceX = (nextPreset.x / Math.max(nextPreset.scale, 0.1)) * scale;
      const sourceY =
        renderedCanvas.height -
        ((nextPreset.y + nextPreset.height) / Math.max(nextPreset.scale, 0.1)) *
          scale;

      cropContext.drawImage(
        renderedCanvas,
        sourceX,
        sourceY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );

      const rotatedCanvas = document.createElement("canvas");
      const rotate = ((nextPreset.rotate % 360) + 360) % 360;
      const isQuarterTurn = rotate === 90 || rotate === 270;
      rotatedCanvas.width = isQuarterTurn
        ? cropCanvas.height
        : cropCanvas.width;
      rotatedCanvas.height = isQuarterTurn
        ? cropCanvas.width
        : cropCanvas.height;
      const rotatedContext = rotatedCanvas.getContext("2d");

      if (!rotatedContext) {
        recipientNameCacheRef.current.set(cacheKey, null);
        return null;
      }

      rotatedContext.fillStyle = "#ffffff";
      rotatedContext.fillRect(0, 0, rotatedCanvas.width, rotatedCanvas.height);
      rotatedContext.translate(
        rotatedCanvas.width / 2,
        rotatedCanvas.height / 2,
      );
      rotatedContext.rotate((rotate * Math.PI) / 180);
      rotatedContext.drawImage(
        cropCanvas,
        -cropCanvas.width / 2,
        -cropCanvas.height / 2,
      );

      const recipientRegionCanvas = cropCanvasRegion(
        rotatedCanvas,
        INPOST_FAMILY_RECIPIENT_REGION,
      );

      if (!recipientRegionCanvas) {
        recipientNameCacheRef.current.set(cacheKey, null);
        return null;
      }

      const worker = await getOcrWorker();
      const { data } = await worker.recognize(recipientRegionCanvas);
      const recipientName = extractInpostFamilyRecipientFromTextLines(
        extractTextLines(data.text),
      );

      recipientNameCacheRef.current.set(cacheKey, recipientName);
      return recipientName;
    } finally {
      pdf.destroy();
    }
  }

  async function extractInpostItalyRecipientName(nextFile: File) {
    const cacheKey = `inpostItaly:${fileCacheKey(nextFile)}`;
    const cachedRecipientName = recipientNameCacheRef.current.get(cacheKey);

    if (cachedRecipientName !== undefined) {
      return cachedRecipientName;
    }

    const arrayBuffer = await nextFile.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;

    try {
      const firstPage = await pdf.getPage(1);
      const textContent = await firstPage.getTextContent();
      const textRecipientName =
        extractInpostItalyRecipientFromPositionedTextLines(
          positionedTextLinesFromItems(textContent.items),
        );

      if (textRecipientName) {
        recipientNameCacheRef.current.set(cacheKey, textRecipientName);
        return textRecipientName;
      }

      const scale = 2.5;
      const viewport = firstPage.getViewport({ scale });
      const renderedCanvas = document.createElement("canvas");
      renderedCanvas.width = Math.ceil(viewport.width);
      renderedCanvas.height = Math.ceil(viewport.height);

      const context = renderedCanvas.getContext("2d");

      if (!context) {
        recipientNameCacheRef.current.set(cacheKey, null);
        return null;
      }

      await firstPage.render({
        canvas: renderedCanvas,
        canvasContext: context,
        viewport,
      }).promise;

      const recipientRegionCanvas = cropCanvasRegion(
        renderedCanvas,
        INPOST_ITALY_RECIPIENT_REGION,
      );

      if (!recipientRegionCanvas) {
        recipientNameCacheRef.current.set(cacheKey, null);
        return null;
      }

      const worker = await getOcrWorker();
      const { data } = await worker.recognize(recipientRegionCanvas);
      const recipientName = extractInpostItalyRecipientFromTextLines(
        extractTextLines(data.text),
      );

      recipientNameCacheRef.current.set(cacheKey, recipientName);
      return recipientName;
    } finally {
      pdf.destroy();
    }
  }

  async function cropPdf(
    nextFile: File,
    nextPreset: CropPreset,
    horizontalOffset: number,
    verticalOffset: number,
    nextLabelType: LabelType,
    nextShowRecipientName: boolean,
    nextShowVintedGoRecipientName: boolean,
    nextShowInpostFamilyRecipientName: boolean,
    nextShowInpostItalyRecipientName: boolean,
    nextHidePosteItalianeSenderAddress: boolean,
    nextHideVintedGoSenderAddress: boolean,
    nextHideInpostItalySenderAddress: boolean,
  ) {
    cropRequestVersionRef.current += 1;
    const requestVersion = cropRequestVersionRef.current;
    setIsProcessing(true);

    try {
      const arrayBuffer = await nextFile.arrayBuffer();
      const workingPdf = await PDFDocument.load(arrayBuffer);
      const firstPage = workingPdf.getPages()[0];

      if (!firstPage) {
        throw new Error(messages.errors.noReadablePage);
      }

      const outputPdf = await PDFDocument.create();
      const outputPage = outputPdf.addPage([
        OUTPUT_PAGE_WIDTH,
        OUTPUT_PAGE_HEIGHT,
      ]);
      const { width: pageWidth, height: pageHeight } = firstPage.getSize();
      const sourcePageRotate =
        ((firstPage.getRotation().angle % 360) + 360) % 360;
      const placement = outputPlacementForPreset(
        pageWidth,
        pageHeight,
        sourcePageRotate,
        nextPreset,
        nextLabelType,
        horizontalOffset,
        verticalOffset,
      );
      const { embeddedRegion, fitScale, pageRotate, positionedPage } =
        placement;
      const embeddedProcessedPage = await outputPdf.embedPage(
        firstPage,
        embeddedRegion,
        [1, 0, 0, 1, -embeddedRegion.left, -embeddedRegion.bottom],
      );
      const drawnWidth = embeddedProcessedPage.width * fitScale;
      const drawnHeight = embeddedProcessedPage.height * fitScale;

      outputPage.drawPage(embeddedProcessedPage, {
        x: positionedPage.x,
        y: positionedPage.y,
        width: drawnWidth,
        height: drawnHeight,
        rotate: degrees(pageRotate),
      });

      if (
        nextLabelType === "posteItaliane" &&
        nextHidePosteItalianeSenderAddress
      ) {
        const basePlacement = outputPlacementForPreset(
          pageWidth,
          pageHeight,
          sourcePageRotate,
          BASE_PRESETS.posteItaliane,
          "posteItaliane",
        );
        const senderAddressSourceBounds = sourceBoundsForOutputRect(
          POSTE_ITALIANE_SENDER_ADDRESS_MASK,
          basePlacement,
        );

        outputPage.drawRectangle({
          ...outputRectForSourceBounds(senderAddressSourceBounds, placement),
          color: rgb(1, 1, 1),
        });
      }

      if (nextLabelType === "vintedGo" && nextHideVintedGoSenderAddress) {
        const basePlacement = outputPlacementForPreset(
          pageWidth,
          pageHeight,
          sourcePageRotate,
          BASE_PRESETS.vintedGo,
          "vintedGo",
        );
        const senderAddressSourceBounds = sourceBoundsForOutputRect(
          VINTED_GO_SENDER_ADDRESS_MASK,
          basePlacement,
        );

        outputPage.drawRectangle({
          ...outputRectForSourceBounds(senderAddressSourceBounds, placement),
          color: rgb(1, 1, 1),
        });
      }

      if (nextLabelType === "inpostItaly" && nextHideInpostItalySenderAddress) {
        outputPage.drawRectangle({
          ...outputRectForSourceMask(
            INPOST_ITALY_SENDER_ADDRESS_MASK,
            pageWidth,
            pageHeight,
            pageRotate,
            fitScale,
            positionedPage,
          ),
          color: rgb(1, 1, 1),
        });
      }

      if (
        (nextLabelType === "posteItaliane" && nextShowRecipientName) ||
        (nextLabelType === "vintedGo" && nextShowVintedGoRecipientName)
      ) {
        const recipientName = await extractPosteItalianeRecipientName(
          nextFile,
          nextPreset,
          nextLabelType,
        );

        if (recipientName) {
          const font = await outputPdf.embedFont(StandardFonts.HelveticaBold);
          const layout = recipientNameLayout();
          const fontSize = fittedRecipientFontSize(
            recipientName,
            layout.width,
            recipientNameFontSize,
            10,
            font,
          );
          const textWidth = font.widthOfTextAtSize(recipientName, fontSize);
          const textHeight = font.heightAtSize(fontSize);

          outputPage.drawText(recipientName, {
            x: layout.x + (layout.width - textWidth) / 2,
            y: layout.y + (layout.height - textHeight) / 2,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
            maxWidth: layout.width,
          });
        }
      }

      if (
        nextLabelType === "inpostFamily" &&
        nextShowInpostFamilyRecipientName
      ) {
        const recipientName = await extractInpostFamilyRecipientName(
          nextFile,
          nextPreset,
        );

        if (recipientName) {
          const uppercaseRecipientName =
            recipientName.toLocaleUpperCase("it-IT");
          const font = await outputPdf.embedFont(StandardFonts.HelveticaBold);
          const layout = inpostItalyRecipientNameLayout();
          const fontSize = fittedRecipientFontSize(
            uppercaseRecipientName,
            layout.width,
            recipientNameFontSize,
            10,
            font,
          );
          const textWidth = font.widthOfTextAtSize(
            uppercaseRecipientName,
            fontSize,
          );
          const textHeight = font.heightAtSize(fontSize);

          outputPage.drawText(uppercaseRecipientName, {
            x: layout.x + (layout.width - textWidth) / 2,
            y: layout.y + (layout.height - textHeight) / 2,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
            maxWidth: layout.width,
          });
        }
      }

      if (nextLabelType === "inpostItaly" && nextShowInpostItalyRecipientName) {
        const recipientName = await extractInpostItalyRecipientName(nextFile);

        if (recipientName) {
          const uppercaseRecipientName =
            recipientName.toLocaleUpperCase("it-IT");
          const font = await outputPdf.embedFont(StandardFonts.HelveticaBold);
          const layout = inpostItalyRecipientNameLayout();
          const fontSize = fittedRecipientFontSize(
            uppercaseRecipientName,
            layout.width,
            recipientNameFontSize,
            10,
            font,
          );
          const textWidth = font.widthOfTextAtSize(
            uppercaseRecipientName,
            fontSize,
          );
          const textHeight = font.heightAtSize(fontSize);

          outputPage.drawText(uppercaseRecipientName, {
            x: layout.x + (layout.width - textWidth) / 2,
            y: layout.y + (layout.height - textHeight) / 2,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
            maxWidth: layout.width,
          });
        }
      }

      const outputBytes = await outputPdf.save();

      const normalizedBytes = new Uint8Array(outputBytes.length);
      normalizedBytes.set(outputBytes);
      const blob = new Blob([normalizedBytes], { type: "application/pdf" });

      if (cropRequestVersionRef.current !== requestVersion) {
        return;
      }

      setPdfUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }

        return URL.createObjectURL(blob);
      });
    } catch (cropError) {
      if (cropRequestVersionRef.current !== requestVersion) {
        return;
      }

      const message =
        cropError instanceof Error
          ? cropError.message
          : messages.errors.processFailed;
      toast.error(message);
      setPdfUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return "";
      });
    } finally {
      if (cropRequestVersionRef.current === requestVersion) {
        setIsProcessing(false);
      }
    }
  }

  function handlePreviewPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (labelType !== "manualEditor" || !file || event.button !== 0) {
      return;
    }

    const frameRect = event.currentTarget.getBoundingClientRect();

    if (frameRect.width <= 0 || frameRect.height <= 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    previewPanRef.current = {
      frameHeight: frameRect.height,
      frameWidth: frameRect.width,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: offsetX,
      startOffsetY: offsetY,
    };
    setIsPreviewPanning(true);
  }

  function handlePreviewPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const interaction = previewPanRef.current;

    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    const deltaX =
      ((event.clientX - interaction.startClientX) / interaction.frameWidth) *
      OUTPUT_PAGE_WIDTH;
    const deltaY =
      ((event.clientY - interaction.startClientY) / interaction.frameHeight) *
      OUTPUT_PAGE_HEIGHT;

    setOffsetX(
      clampOffsetValue(
        interaction.startOffsetX + deltaX,
        MANUAL_OFFSET_MIN,
        MANUAL_OFFSET_MAX,
      ),
    );
    setOffsetY(
      clampOffsetValue(
        interaction.startOffsetY + deltaY,
        MANUAL_OFFSET_MIN,
        MANUAL_OFFSET_MAX,
      ),
    );
  }

  function updateScaleOffset(nextValue: number) {
    const clampedValue = clampScaleOffsetValue(
      nextValue,
      scaleOffsetBounds.min,
      scaleOffsetBounds.max,
    );
    const nextScale = Math.max(0.2, basePreset.scale + clampedValue);
    const currentScale = Math.max(0.2, preset.scale);

    if (Math.abs(nextScale - currentScale) <= 0.0001) {
      setScaleOffset(clampedValue);
      return;
    }

    const scaleRatio = nextScale / currentScale;

    setScaleOffset(clampedValue);
    setOffsetX((currentOffset) =>
      clampOffsetValue(
        currentOffset * scaleRatio,
        offsetBounds.min,
        offsetBounds.max,
      ),
    );
    setOffsetY((currentOffset) =>
      clampOffsetValue(
        currentOffset * scaleRatio,
        offsetBounds.min,
        offsetBounds.max,
      ),
    );
  }

  function finishPreviewPan(
    event: React.PointerEvent<HTMLDivElement>,
    releasePointerCapture: boolean,
  ) {
    const interaction = previewPanRef.current;

    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }

    if (
      releasePointerCapture &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    previewPanRef.current = null;
    setIsPreviewPanning(false);
  }

  return (
    <section className="border-t border-[#16302b14] pt-6 md:flex md:h-full md:min-h-0 md:flex-col md:pt-4">
      <div className="grid gap-8 md:h-full md:min-h-0 md:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="min-w-0 md:flex md:h-full md:min-h-0 md:flex-col md:order-2">
          <div className="md:shrink-0">
            <div className="lg:flex lg:items-end lg:justify-between lg:gap-6">
              <div>
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent">
                  {messages.output.eyebrow}
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-accent-deep">
                  {messages.output.title}
                </h2>
              </div>

              {pdfUrl ? (
                <div className="hidden lg:flex lg:justify-end">
                  <ButtonGroup
                    aria-label={messages.output.actionsLabel}
                    className="rounded-full border border-[#16302b20] bg-white shadow-[0_10px_30px_rgba(8,43,43,0.04)]"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearSelectedPdf}
                      className="size-10 shrink-0 border-transparent bg-transparent px-0 text-[#bf3f3f] hover:border-transparent hover:bg-[#fff5f5] hover:text-[#9f2e2e]"
                      aria-label={messages.output.removePdf}
                    >
                      <Trash2 size={16} />
                    </Button>
                    <ButtonGroupSeparator />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openFileDialog}
                      className="border-transparent bg-transparent hover:border-transparent hover:bg-[#f6fbfa]"
                    >
                      <FileUp size={16} />
                      {messages.output.replacePdf}
                    </Button>
                    <ButtonGroupSeparator />
                    <Button
                      asChild
                      variant="outline"
                      className="border-transparent bg-transparent hover:border-transparent hover:bg-[#f6fbfa]"
                    >
                      <a
                        href={pdfUrl}
                        download={
                          file
                            ? `${file.name.replace(/\.pdf$/i, "")}-4x6.pdf`
                            : "croplet-label-4x6.pdf"
                        }
                      >
                        <Download size={16} />
                        {messages.output.exportPdf}
                      </a>
                    </Button>
                    <ButtonGroupSeparator />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrint}
                      className="border-transparent bg-transparent hover:border-transparent hover:bg-[#f6fbfa]"
                    >
                      <Printer size={16} />
                      {messages.output.print}
                    </Button>
                  </ButtonGroup>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 min-h-112 overflow-hidden rounded-4xl border border-[#16302b14] bg-[linear-gradient(180deg,#fdfefd_0%,#f6fbfa_100%)] transition md:min-h-0 md:flex-1 lg:mt-6">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(event) =>
                handleSelectedFile(event.target.files?.[0] ?? null)
              }
            />

            {pdfUrl ? (
              <div className="flex min-h-112 flex-col items-center justify-center md:h-full md:min-h-0">
                <div className="flex w-full items-center justify-center p-6 sm:p-10 md:h-full md:min-h-0 md:flex-1 md:p-8">
                  <div className="flex size-full items-center justify-center aspect-2/3">
                    <div
                      ref={previewFrameRef}
                      onPointerDown={handlePreviewPointerDown}
                      onPointerMove={handlePreviewPointerMove}
                      onPointerUp={(event) => finishPreviewPan(event, true)}
                      onPointerCancel={(event) =>
                        finishPreviewPan(event, false)
                      }
                      style={previewCursorStyle}
                      className={cn(
                        "relative aspect-2/3 w-full max-w-md overflow-hidden box-border border-2 border-accent rounded-lg bg-white shadow-[0_14px_40px_rgba(8,43,43,0.08)] md:h-full md:w-auto md:max-w-full",
                        labelType === "manualEditor" &&
                          "touch-none select-none pdf-preview-grab",
                        labelType === "manualEditor" &&
                          isPreviewPanning &&
                          "pdf-preview-grabbing",
                      )}
                    >
                      {isProcessing ? (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/72 backdrop-blur-[1px]">
                          <div className="h-9 w-9 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
                        </div>
                      ) : null}
                      <Document
                        file={pdfUrl}
                        loading={null}
                        onLoadError={(loadError) =>
                          toast.error(loadError.message)
                        }
                        className="pdf-preview-document flex h-full w-full items-center justify-center"
                      >
                        <Page
                          className="pdf-preview-page"
                          pageNumber={1}
                          width={previewCanvasWidth}
                          scale={3}
                          loading={null}
                          renderAnnotationLayer={false}
                          renderTextLayer={false}
                        />
                      </Document>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-112 items-center justify-center p-6 md:h-full md:min-h-0">
                <div
                  ref={dropZoneRef}
                  role="button"
                  tabIndex={0}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={openFileDialog}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openFileDialog();
                    }
                  }}
                  className={cn(
                    "block w-full max-w-lg rounded-[1.8rem] border-2 border-dashed bg-white/80 p-8 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20",
                    isDragging
                      ? "cursor-copy border-accent bg-white"
                      : "cursor-pointer border-[#16302b20] hover:border-accent hover:bg-white",
                  )}
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-light text-accent">
                    <UploadCloud size={26} />
                  </div>
                  <div className="mt-5 text-2xl font-semibold tracking-tight text-accent-deep">
                    {messages.output.dragTitle}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-croplet-muted">
                    {messages.output.dragDescription}
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openFileDialog();
                      }}
                    >
                      <FileUp size={16} />
                      {messages.output.choosePdf}
                    </Button>
                  </div>
                  <div className="mt-8">
                    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#6a8680]">
                      <span className="h-px flex-1 bg-[#16302b12]" />
                      {messages.output.importDivider}
                      <span className="h-px flex-1 bg-[#16302b12]" />
                    </div>
                    <div
                      className="mt-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <label className="sr-only" htmlFor="pdf-url">
                        {messages.output.pdfUrl}
                      </label>
                      <div className="relative">
                        <LinkIcon
                          size={16}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6a8680]"
                        />
                        <input
                          ref={importUrlInputRef}
                          id="pdf-url"
                          type="url"
                          inputMode="url"
                          placeholder={messages.output.pdfUrlPlaceholder}
                          value={importUrl}
                          onChange={(event) => setImportUrl(event.target.value)}
                          onKeyDown={(event) => {
                            event.stopPropagation();
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void handleImportFromUrl();
                            }
                          }}
                          className="h-11 w-full rounded-full border border-[#16302b18] bg-white px-8 pr-16 text-base text-croplet-text outline-none transition placeholder:text-[#6a8680] focus:border-accent focus:ring-2 focus:ring-accent/15 md:text-sm"
                        />
                        <Button
                          type="button"
                          aria-label={
                            isImportingUrl
                              ? messages.output.importingPdf
                              : messages.output.importPdfFromUrl
                          }
                          aria-busy={isImportingUrl}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleImportFromUrl();
                          }}
                          disabled={isImportingUrl || !isImportUrlValid}
                          className={cn(
                            "absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2 px-0 disabled:bg-croplet-text/45",
                            isImportingUrl &&
                              "disabled:pointer-events-auto disabled:cursor-not-allowed",
                          )}
                        >
                          {isImportingUrl ? (
                            <LoaderCircle size={15} className="animate-spin" />
                          ) : (
                            <ArrowRight size={15} />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {pdfUrl ? (
            <div className="mt-6 flex flex-wrap justify-center gap-2 lg:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={clearSelectedPdf}
                className="size-10 shrink-0 rounded-full border-[#c94b4b33] px-0 text-[#bf3f3f] hover:border-[#bf3f3f] hover:bg-[#fff5f5] hover:text-[#9f2e2e]"
                aria-label={messages.output.removePdf}
              >
                <Trash2 size={16} />
              </Button>
              <Button type="button" variant="outline" onClick={openFileDialog}>
                <FileUp size={16} />
                {messages.output.replacePdf}
              </Button>
              <Button asChild variant="outline">
                <a
                  href={pdfUrl}
                  download={
                    file
                      ? `${file.name.replace(/\.pdf$/i, "")}-4x6.pdf`
                      : "croplet-label-4x6.pdf"
                  }
                >
                  <Download size={16} />
                  {messages.output.exportPdf}
                </a>
              </Button>
              <Button type="button" variant="outline" onClick={handlePrint}>
                <Printer size={16} />
                {messages.output.print}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="space-y-6 md:flex md:h-full md:min-h-0 md:flex-col md:overflow-hidden md:order-1">
          <div>
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent">
              {messages.controls.eyebrow}
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-accent-deep">
              {messages.controls.title}
            </h2>
          </div>

          <div className="space-y-6 overflow-hidden rounded-4xl border border-[#16302b14] bg-[linear-gradient(180deg,#fdfefd_0%,#f6fbfa_100%)] p-5 md:flex md:flex-1 md:flex-col md:overflow-auto">
            <div className="space-y-2">
              <Label htmlFor="label-type">{messages.controls.labelType}</Label>
              <Select
                value={labelType}
                onValueChange={(value) => setLabelType(value as LabelType)}
                disabled={controlsDisabled}
              >
                <SelectTrigger id="label-type">
                  <SelectValue
                    placeholder={messages.controls.chooseLabelType}
                  />
                </SelectTrigger>
                <SelectContent>
                  {localizedLabelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {labelType === "brt" ? (
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-[1.2rem] border border-[#16302b10] bg-[#fcfdfc] px-4 py-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-croplet-text">
                    <span>{messages.controls.useHalfPage}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center p-0 text-accent transition hover:text-[#14574f] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                          aria-label={messages.controls.useHalfPageInfoLabel}
                        >
                          <Info size={12} strokeWidth={2.2} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="center"
                        sideOffset={10}
                        className="w-64 font-normal sm:w-72"
                      >
                        {messages.controls.useHalfPageInfoTooltip}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="text-sm text-croplet-muted">
                    {messages.controls.useHalfPageHint}
                  </div>
                </div>
                <Switch
                  checked={useHalfPageBRT}
                  onCheckedChange={setUseHalfPageBRT}
                  disabled={controlsDisabled}
                  className="shrink-0"
                />
              </div>
            ) : null}

            {labelType === "posteItaliane" ||
            labelType === "vintedGo" ||
            labelType === "inpostFamily" ||
            labelType === "inpostItaly" ? (
              <div className="rounded-[1.2rem] border border-[#16302b10] bg-[#fcfdfc] px-4">
                <div className="grid divide-y divide-[#16302b10]">
                  {labelType === "posteItaliane" ||
                  labelType === "vintedGo" ||
                  labelType === "inpostItaly" ? (
                    <div className="grid h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-none text-croplet-text">
                          {messages.controls.hideSenderAddress}
                        </div>
                      </div>
                      <Switch
                        checked={
                          labelType === "inpostItaly"
                            ? hideInpostItalySenderAddress
                            : labelType === "vintedGo"
                              ? hideVintedGoSenderAddress
                              : hidePosteItalianeSenderAddress
                        }
                        onCheckedChange={
                          labelType === "inpostItaly"
                            ? setHideInpostItalySenderAddress
                            : labelType === "vintedGo"
                              ? setHideVintedGoSenderAddress
                              : setHidePosteItalianeSenderAddress
                        }
                        disabled={controlsDisabled}
                        className="shrink-0"
                      />
                    </div>
                  ) : null}

                  <div className="grid h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-sm font-medium leading-none text-croplet-text">
                        <span>{messages.controls.showRecipientName}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center p-0 text-accent transition hover:text-[#14574f] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                              aria-label={
                                messages.controls.showRecipientNameInfoLabel
                              }
                            >
                              <Info size={12} strokeWidth={2.2} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="center"
                            sideOffset={10}
                            className="w-64 font-normal sm:w-72"
                          >
                            {messages.controls.showRecipientNameInfoTooltip}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <Switch
                      checked={selectedShowRecipientName}
                      onCheckedChange={
                        labelType === "inpostItaly"
                          ? setShowInpostItalyRecipientName
                          : labelType === "inpostFamily"
                            ? setShowInpostFamilyRecipientName
                            : labelType === "vintedGo"
                              ? setShowVintedGoRecipientName
                              : setShowRecipientName
                      }
                      disabled={controlsDisabled}
                      className="shrink-0"
                    />
                  </div>

                  <div className="grid h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-none text-croplet-text">
                        {messages.controls.recipientNameSize}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          updateRecipientNameFontSize(recipientNameFontSize - 1)
                        }
                        disabled={
                          controlsDisabled || !selectedShowRecipientName
                        }
                        className="size-8 shrink-0 rounded-full px-0 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:hover:border-[#16302b20] disabled:hover:text-croplet-text"
                        aria-label={messages.controls.decreaseRecipientNameSize}
                      >
                        <Minus size={14} />
                      </Button>
                      <input
                        type="number"
                        min={10}
                        max={72}
                        step={1}
                        value={recipientNameFontSize}
                        onChange={(event) =>
                          updateRecipientNameFontSize(
                            Number(event.target.value) || 18,
                          )
                        }
                        disabled={
                          controlsDisabled || !selectedShowRecipientName
                        }
                        className="w-10 h-8 appearance-none rounded-md border border-[#16302b18] bg-white px-2 text-center text-sm leading-none text-croplet-text outline-none transition [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder:text-[#6a8680] focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:bg-[#16302b08] disabled:text-[#6a8680]"
                        aria-label={
                          messages.controls.recipientNameSizeAdjustment
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          updateRecipientNameFontSize(recipientNameFontSize + 1)
                        }
                        disabled={
                          controlsDisabled || !selectedShowRecipientName
                        }
                        className="size-8 shrink-0 rounded-full px-0 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:hover:border-[#16302b20] disabled:hover:text-croplet-text"
                        aria-label={messages.controls.increaseRecipientNameSize}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-croplet-muted">
                    {messages.controls.horizontal}
                  </span>
                  <span className="font-medium text-croplet-text">
                    {offsetX}
                  </span>
                </div>
                <SliderWithDefaultNotch
                  value={[offsetX]}
                  notchValue={0}
                  min={offsetBounds.min}
                  max={offsetBounds.max}
                  step={1}
                  disabled={controlsDisabled}
                  onPassNotch={triggerSelectionHaptic}
                  onValueChange={([value]) => setOffsetX(value ?? 0)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-croplet-muted">
                    {messages.controls.vertical}
                  </span>
                  <span className="font-medium text-croplet-text">
                    {offsetY}
                  </span>
                </div>
                <SliderWithDefaultNotch
                  value={[offsetY]}
                  notchValue={0}
                  min={offsetBounds.min}
                  max={offsetBounds.max}
                  step={1}
                  disabled={controlsDisabled}
                  onPassNotch={triggerSelectionHaptic}
                  onValueChange={([value]) => setOffsetY(value ?? 0)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-croplet-muted">
                    {messages.controls.scale}
                  </span>
                  <span className="font-medium text-croplet-text">
                    {Math.round(preset.scale * 100)}%
                  </span>
                </div>
                <SliderWithDefaultNotch
                  value={[scaleOffset]}
                  notchValue={0}
                  min={scaleOffsetBounds.min}
                  max={scaleOffsetBounds.max}
                  step={0.01}
                  disabled={controlsDisabled}
                  onPassNotch={triggerSelectionHaptic}
                  onValueChange={([value]) => updateScaleOffset(value ?? 0)}
                />
              </div>

              {labelType === "manualEditor" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-croplet-muted">
                      {messages.controls.rotation}
                    </span>
                    <span className="font-medium text-croplet-text">
                      {rotationOffset}°
                    </span>
                  </div>
                  <SliderWithDefaultNotch
                    value={[rotationOffset]}
                    notchValue={0}
                    min={ROTATION_OFFSET_MIN}
                    max={ROTATION_OFFSET_MAX}
                    step={90}
                    disabled={controlsDisabled}
                    onPassNotch={triggerSelectionHaptic}
                    onValueChange={([value]) => setRotationOffset(value ?? 0)}
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="justify-center px-4 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-accent"
                  disabled={controlsDisabled}
                  onClick={() => {
                    setOffsetX(0);
                    setOffsetY(0);
                    setScaleOffset(0);
                    setRotationOffset(0);
                    setRecipientNameFontSize(18);
                  }}
                >
                  {messages.controls.resetAdjustments}
                </Button>
              </div>
            </div>

            <div className="md:flex-1" />

            <div className="flex items-center justify-center gap-4 border-t border-[#16302b10] pt-4">
              <Link
                href="/privacy"
                className="text-sm font-medium text-croplet-muted transition-colors hover:text-accent"
              >
                {messages.controls.privacy}
              </Link>
              <ExternalLink
                href="https://buymeacoffee.com/ragone"
                className="text-sm font-medium text-croplet-muted transition-colors hover:text-accent"
              >
                {messages.controls.donate}
              </ExternalLink>
              <ExternalLink
                href="https://github.com/umbertoragone/croplet"
                className="text-sm font-medium text-croplet-muted transition-colors hover:text-accent"
              >
                {messages.controls.viewOnGitHub}
              </ExternalLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
