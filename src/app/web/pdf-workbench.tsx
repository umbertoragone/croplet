"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Download,
  FileUp,
  Link as LinkIcon,
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

import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
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

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import type { WebLocale } from "./localization";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type LabelType =
  | "posteItaliane"
  | "vintedGo"
  | "brt"
  | "inpostFamily"
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
};

const OUTPUT_PAGE_WIDTH = 288;
const OUTPUT_PAGE_HEIGHT = 432;
const INPOST_LOGO_REGION = {
  x: 0.62,
  y: 0.58,
  width: 0.33,
  height: 0.24,
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
    x: 9,
    y: 556,
    width: 288,
    height: 432,
    rotate: 180,
    scale: 1.112,
  },
  inpostFamily: {
    x: 90,
    y: 38,
    width: 432,
    height: 288,
    rotate: 90,
    scale: 1.03,
  },
  ups: { x: 60, y: 60, width: 288, height: 432, rotate: 0, scale: 1 },
  dhl: { x: 50, y: 45, width: 288, height: 432, rotate: 0, scale: 0.85 },
  manualEditor: { x: 48, y: 45, width: 288, height: 432, rotate: 0, scale: 1 },
};

const BRT_PRESETS = {
  fullPage: { x: 65, y: 853, width: 432, height: 288, rotate: 270, scale: 1.6 },
  halfPage: { x: 44, y: 338, width: 288, height: 432, rotate: 0, scale: 1.08 },
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

  if (includesAnyKeyword(normalizedText, ["vinted go", "vintedgo"])) {
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
    .replace(/[^\p{L} .'-]/gu, "")
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

  return letterOnlyWords.length >= 2;
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

function snapToDefault(value: number, defaultValue: number, tolerance: number) {
  return Math.abs(value - defaultValue) <= tolerance ? defaultValue : value;
}

function SliderWithDefaultNotch({
  notchValue,
  min,
  max,
  className,
  ...props
}: SliderWithDefaultNotchProps) {
  if (typeof min !== "number" || typeof max !== "number" || min === max) {
    return <Slider className={className} min={min} max={max} {...props} />;
  }

  const notchPercent = ((notchValue - min) / (max - min)) * 100;
  const currentValue = Array.isArray(props.value) ? props.value[0] : undefined;
  const shouldShowNotch =
    typeof currentValue !== "number" ||
    Math.abs(currentValue - notchValue) > 0.0001;

  return (
    <Slider
      className={className}
      min={min}
      max={max}
      notchPercent={shouldShowNotch ? notchPercent : undefined}
      {...props}
    />
  );
}

type PdfWorkbenchProps = {
  locale: WebLocale;
  messages: {
    labelOptions: Record<LabelType, string>;
    errors: {
      choosePdf: string;
      enterPdfUrl: string;
      enterValidUrl: string;
      fetchPdfUrl: string;
      urlNotPdf: string;
      importFailed: string;
      noReadablePage: string;
      noProcessedPage: string;
      processFailed: string;
    };
    output: {
      eyebrow: string;
      title: string;
      actionsLabel: string;
      removePdf: string;
      replacePdf: string;
      exportPdf: string;
      print: string;
      dragTitle: string;
      dragDescription: string;
      choosePdf: string;
      importDivider: string;
      pdfUrl: string;
      pdfUrlPlaceholder: string;
      importingPdf: string;
      importPdfFromUrl: string;
    };
    controls: {
      eyebrow: string;
      title: string;
      labelType: string;
      chooseLabelType: string;
      useHalfPage: string;
      useHalfPageHint: string;
      showRecipientName: string;
      recipientNameSize: string;
      decreaseRecipientNameSize: string;
      increaseRecipientNameSize: string;
      recipientNameSizeAdjustment: string;
      horizontal: string;
      vertical: string;
      scale: string;
      rotation: string;
      resetAdjustments: string;
      privacy: string;
    };
  };
};

export default function PdfWorkbench({ messages }: PdfWorkbenchProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewFrameRef = useRef<HTMLDivElement | null>(null);
  const ocrWorkerRef = useRef<TesseractWorker | null>(null);
  const recipientNameCacheRef = useRef<Map<string, string | null>>(new Map());
  const labelDetectionCacheRef = useRef<Map<string, DetectedLabel | null>>(
    new Map(),
  );
  const fileSelectionVersionRef = useRef(0);
  const cropRequestVersionRef = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [labelType, setLabelType] = useState<LabelType>("posteItaliane");
  const [useHalfPageBRT, setUseHalfPageBRT] = useState(true);
  const [showRecipientName, setShowRecipientName] = useState(true);
  const [recipientNameFontSize, setRecipientNameFontSize] = useState(18);
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
  const controlsDisabled = file === null;

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
    ) => {
      void cropPdf(
        nextFile,
        nextPreset,
        horizontalOffset,
        verticalOffset,
        nextLabelType,
        nextShowRecipientName,
      );
    },
  );
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
      (((basePreset.rotate + rotationOffset) % 360) + 360) % 360;

    return {
      ...basePreset,
      rotate: nextRotate,
      scale: Math.max(0.2, basePreset.scale + scaleOffset),
    };
  }, [basePreset, rotationOffset, scaleOffset]);

  const previewCanvasWidth =
    previewFrameWidth > 4 ? previewFrameWidth - 4 : undefined;

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
    return () => {
      const worker = ocrWorkerRef.current;

      if (worker) {
        void worker.terminate();
        ocrWorkerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!file) {
      return;
    }

    runCropPdf(file, preset, offsetX, offsetY, labelType, showRecipientName);
  }, [
    file,
    labelType,
    offsetX,
    offsetY,
    preset,
    recipientNameFontSize,
    showRecipientName,
  ]);

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
  }, []);

  function openFileDialog() {
    inputRef.current?.click();
  }

  function clearSelectedPdf() {
    fileSelectionVersionRef.current += 1;
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

    const looksLikePdf =
      nextFile.type === "application/pdf" ||
      nextFile.name.toLowerCase().endsWith(".pdf");

    if (!looksLikePdf) {
      toast.error(messages.errors.choosePdf);
      return;
    }

    recipientNameCacheRef.current.clear();
    labelDetectionCacheRef.current.clear();
    fileSelectionVersionRef.current += 1;
    const selectionVersion = fileSelectionVersionRef.current;

    setLabelType(DEFAULT_LABEL_TYPE);
    setUseHalfPageBRT(true);
    setFile(nextFile);

    void detectImportedLabelType(nextFile).then((detectedLabel) => {
      if (fileSelectionVersionRef.current !== selectionVersion) {
        return;
      }

      if (!detectedLabel) {
        setLabelType(DEFAULT_LABEL_TYPE);
        setUseHalfPageBRT(true);
        return;
      }

      setLabelType(detectedLabel.labelType);

      if (detectedLabel.labelType === "brt") {
        setUseHalfPageBRT(detectedLabel.useHalfPageBRT ?? true);
      }
    });
  }

  async function handleImportFromUrl() {
    const trimmedUrl = importUrl.trim();

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
      const response = await fetch(parsedUrl.toString());

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
    setRecipientNameFontSize(Math.max(10, Math.min(72, nextValue)));
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

      if (textMatch) {
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

      labelDetectionCacheRef.current.set(cacheKey, ocrMatch);
      return ocrMatch;
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
  ) {
    const cacheKey = fileCacheKey(nextFile);
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

  async function cropPdf(
    nextFile: File,
    nextPreset: CropPreset,
    horizontalOffset: number,
    verticalOffset: number,
    nextLabelType: LabelType,
    nextShowRecipientName: boolean,
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

      firstPage.setCropBox(
        nextPreset.x,
        nextPreset.y,
        nextPreset.width,
        nextPreset.height,
      );

      if (nextPreset.rotate !== 0) {
        firstPage.setRotation(degrees(nextPreset.rotate));
      }

      let intermediateBytes: Uint8Array;

      if (nextPreset.scale !== 1) {
        const scaledPdf = await PDFDocument.create();
        const [copiedPage] = await scaledPdf.copyPages(workingPdf, [0]);
        copiedPage.setCropBox(
          nextPreset.x,
          nextPreset.y,
          nextPreset.width,
          nextPreset.height,
        );
        copiedPage.scale(nextPreset.scale, nextPreset.scale);
        scaledPdf.addPage(copiedPage);
        intermediateBytes = await scaledPdf.save();
      } else {
        intermediateBytes = await workingPdf.save();
      }

      const processedPdf = await PDFDocument.load(intermediateBytes);
      const processedPage = processedPdf.getPages()[0];

      if (!processedPage) {
        throw new Error(messages.errors.noProcessedPage);
      }

      const cropBox = processedPage.getCropBox();
      const outputPdf = await PDFDocument.create();
      const outputPage = outputPdf.addPage([
        OUTPUT_PAGE_WIDTH,
        OUTPUT_PAGE_HEIGHT,
      ]);
      const embeddedProcessedPage = await outputPdf.embedPage(
        processedPage,
        {
          left: cropBox.x,
          bottom: cropBox.y,
          right: cropBox.x + cropBox.width,
          top: cropBox.y + cropBox.height,
        },
        [1, 0, 0, 1, -cropBox.x, -cropBox.y],
      );
      const pageRotate =
        ((processedPage.getRotation().angle % 360) + 360) % 360;
      const displayWidth =
        pageRotate === 90 || pageRotate === 270
          ? embeddedProcessedPage.height
          : embeddedProcessedPage.width;
      const displayHeight =
        pageRotate === 90 || pageRotate === 270
          ? embeddedProcessedPage.width
          : embeddedProcessedPage.height;
      const fitScale = Math.min(
        OUTPUT_PAGE_WIDTH / displayWidth,
        OUTPUT_PAGE_HEIGHT / displayHeight,
      );
      const drawnWidth = embeddedProcessedPage.width * fitScale;
      const drawnHeight = embeddedProcessedPage.height * fitScale;

      const positionedPage = (() => {
        switch (pageRotate) {
          case 90:
            return {
              x: (OUTPUT_PAGE_WIDTH + drawnHeight) / 2,
              y: (OUTPUT_PAGE_HEIGHT - drawnWidth) / 2,
            };
          case 180:
            return {
              x: (OUTPUT_PAGE_WIDTH + drawnWidth) / 2,
              y: (OUTPUT_PAGE_HEIGHT + drawnHeight) / 2,
            };
          case 270:
            return {
              x: (OUTPUT_PAGE_WIDTH - drawnHeight) / 2,
              y: (OUTPUT_PAGE_HEIGHT + drawnWidth) / 2,
            };
          default:
            return {
              x: (OUTPUT_PAGE_WIDTH - drawnWidth) / 2,
              y: (OUTPUT_PAGE_HEIGHT - drawnHeight) / 2,
            };
        }
      })();

      outputPage.drawPage(embeddedProcessedPage, {
        x: positionedPage.x - horizontalOffset,
        y: positionedPage.y + verticalOffset,
        width: drawnWidth,
        height: drawnHeight,
        rotate: degrees(pageRotate),
      });

      if (nextLabelType === "posteItaliane" && nextShowRecipientName) {
        const recipientName = await extractPosteItalianeRecipientName(
          nextFile,
          nextPreset,
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

  return (
    <section className="border-t border-[#16302b14] pt-6 md:flex md:h-full md:min-h-0 md:flex-col md:pt-4">
      <div className="grid gap-8 md:h-full md:min-h-0 md:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="min-w-0 md:flex md:h-full md:min-h-0 md:flex-col md:order-2">
          <div className="md:shrink-0">
            <div className="lg:flex lg:items-end lg:justify-between lg:gap-6">
              <div>
                  <div className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#1b6b63]">
                  {messages.output.eyebrow}
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#082b2b]">
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

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleSelectedFile(event.dataTransfer.files?.[0] ?? null);
            }}
            className={`mt-6 min-h-[28rem] overflow-hidden rounded-[2rem] border bg-[linear-gradient(180deg,#fdfefd_0%,#f6fbfa_100%)] transition md:min-h-0 md:flex-1 lg:mt-6 ${
              isDragging
                ? "border-[#1b6b63] ring-4 ring-[#1b6b63]/10"
                : "border-[#16302b14]"
            }`}
          >
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
              <div className="flex min-h-[28rem] flex-col items-center justify-center md:h-full md:min-h-0">
                <div className="flex w-full items-center justify-center p-6 sm:p-10 md:h-full md:min-h-0 md:flex-1 md:p-8">
                  <div className="flex size-full items-center justify-center aspect-2/3">
                    <div
                      ref={previewFrameRef}
                      className="relative aspect-2/3 w-full max-w-[28rem] overflow-hidden box-border border-2 border-[#1b6b63] rounded-lg bg-white shadow-[0_14px_40px_rgba(8,43,43,0.08)] md:h-full md:w-auto md:max-w-full"
                    >
                      {isProcessing ? (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/72 backdrop-blur-[1px]">
                          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#1b6b63]/20 border-t-[#1b6b63]" />
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
              <div className="flex min-h-[28rem] items-center justify-center p-6 md:h-full md:min-h-0">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={openFileDialog}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openFileDialog();
                    }
                  }}
                  className="block w-full max-w-lg cursor-pointer rounded-[1.8rem] border-2 border-dashed border-[#16302b20] bg-white/80 p-8 text-center transition hover:border-[#1b6b63] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b6b63]/20"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f3f1] text-[#1b6b63]">
                    <UploadCloud size={26} />
                  </div>
                  <div className="mt-5 text-2xl font-semibold tracking-tight text-[#082b2b]">
                    {messages.output.dragTitle}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[#56716a]">
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
                          className="h-11 w-full rounded-full border border-[#16302b18] bg-white px-8 pr-16 text-sm text-[#16302b] outline-none transition placeholder:text-[#6a8680] focus:border-[#1b6b63] focus:ring-2 focus:ring-[#1b6b63]/15"
                        />
                        <button
                          type="button"
                          aria-label={
                            isImportingUrl
                              ? messages.output.importingPdf
                              : messages.output.importPdfFromUrl
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleImportFromUrl();
                          }}
                          disabled={isImportingUrl || !isImportUrlValid}
                          className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#16302b] text-white transition hover:bg-[#0f2523] disabled:cursor-not-allowed disabled:bg-[#16302b]/45"
                        >
                          <ArrowRight size={15} />
                        </button>
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
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#1b6b63]">
              {messages.controls.eyebrow}
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#082b2b]">
              {messages.controls.title}
            </h2>
          </div>

          <div className="space-y-6 overflow-hidden rounded-[2rem] border border-[#16302b14] bg-[linear-gradient(180deg,#fdfefd_0%,#f6fbfa_100%)] p-5 md:flex md:flex-1 md:flex-col md:overflow-auto">
            <div className="space-y-2">
              <Label htmlFor="label-type">{messages.controls.labelType}</Label>
              <Select
                value={labelType}
                onValueChange={(value) => setLabelType(value as LabelType)}
                disabled={controlsDisabled}
              >
                <SelectTrigger id="label-type">
                  <SelectValue placeholder={messages.controls.chooseLabelType} />
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
                  <div className="text-sm font-medium text-[#16302b]">
                    {messages.controls.useHalfPage}
                  </div>
                  <div className="text-sm text-[#56716a]">
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

            {labelType === "posteItaliane" ? (
              <div className="rounded-[1.2rem] border border-[#16302b10] bg-[#fcfdfc] px-4">
                <div className="grid divide-y divide-[#16302b10]">
                  <div className="grid h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-none text-[#16302b]">
                        {messages.controls.showRecipientName}
                      </div>
                    </div>
                    <Switch
                      checked={showRecipientName}
                      onCheckedChange={setShowRecipientName}
                      disabled={controlsDisabled}
                      className="shrink-0"
                    />
                  </div>

                  <div className="grid h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-none text-[#16302b]">
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
                        disabled={controlsDisabled || !showRecipientName}
                        className="size-8 shrink-0 rounded-full px-0"
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
                        disabled={controlsDisabled || !showRecipientName}
                        className="w-10 h-8 appearance-none rounded-md border border-[#16302b18] bg-white px-2 text-center text-sm leading-none text-[#16302b] outline-none transition [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder:text-[#6a8680] focus:border-[#1b6b63] focus:ring-2 focus:ring-[#1b6b63]/15 disabled:cursor-not-allowed disabled:bg-[#16302b08] disabled:text-[#6a8680]"
                        aria-label={messages.controls.recipientNameSizeAdjustment}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          updateRecipientNameFontSize(recipientNameFontSize + 1)
                        }
                        disabled={controlsDisabled || !showRecipientName}
                        className="size-8 shrink-0 rounded-full px-0"
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
                  <span className="text-[#56716a]">
                    {messages.controls.horizontal}
                  </span>
                  <span className="font-medium text-[#16302b]">{offsetX}</span>
                </div>
                <SliderWithDefaultNotch
                  value={[offsetX]}
                  notchValue={0}
                  min={-120}
                  max={120}
                  step={1}
                  disabled={controlsDisabled}
                  onValueChange={([value]) =>
                    setOffsetX(snapToDefault(value ?? 0, 0, 4))
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#56716a]">
                    {messages.controls.vertical}
                  </span>
                  <span className="font-medium text-[#16302b]">{offsetY}</span>
                </div>
                <SliderWithDefaultNotch
                  value={[offsetY]}
                  notchValue={0}
                  min={-120}
                  max={120}
                  step={1}
                  disabled={controlsDisabled}
                  onValueChange={([value]) =>
                    setOffsetY(snapToDefault(value ?? 0, 0, 4))
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#56716a]">
                    {messages.controls.scale}
                  </span>
                  <span className="font-medium text-[#16302b]">
                    {Math.round(preset.scale * 100)}%
                  </span>
                </div>
                <SliderWithDefaultNotch
                  value={[scaleOffset]}
                  notchValue={0}
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                  disabled={controlsDisabled}
                  onValueChange={([value]) =>
                    setScaleOffset(snapToDefault(value ?? 0, 0, 0.03))
                  }
                />
              </div>

              {labelType === "manualEditor" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#56716a]">
                      {messages.controls.rotation}
                    </span>
                    <span className="font-medium text-[#16302b]">
                      {preset.rotate}°
                    </span>
                  </div>
                  <SliderWithDefaultNotch
                    value={[rotationOffset]}
                    notchValue={0}
                    min={0}
                    max={270}
                    step={90}
                    disabled={controlsDisabled}
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
                  className="justify-center px-4"
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

            <div className="flex justify-center border-t border-[#16302b10] pt-4">
              <Link
                href="/privacy"
                className="text-sm font-medium text-[#56716a] transition-colors hover:text-[#1b6b63]"
              >
                {messages.controls.privacy}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
