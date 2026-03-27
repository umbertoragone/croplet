"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Download,
  FileUp,
  Link as LinkIcon,
  Printer,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { degrees, PDFDocument } from "pdf-lib";
import { Document, Page, pdfjs } from "react-pdf";
import { toast } from "sonner";

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

const OUTPUT_PAGE_WIDTH = 288;
const OUTPUT_PAGE_HEIGHT = 432;

const LABEL_OPTIONS: { value: LabelType; label: string }[] = [
  { value: "posteItaliane", label: "Poste Italiane" },
  { value: "vintedGo", label: "Poste Italiane (VintedGo)" },
  { value: "brt", label: "BRT" },
  { value: "inpostFamily", label: "InPost / Mondial Relay / Hermes" },
  { value: "ups", label: "UPS" },
  { value: "dhl", label: "DHL" },
  { value: "manualEditor", label: "Manual crop" },
];

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

export default function PdfWorkbench() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewFrameRef = useRef<HTMLDivElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [labelType, setLabelType] = useState<LabelType>("posteItaliane");
  const [useHalfPageBRT, setUseHalfPageBRT] = useState(false);
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

  const basePreset = useMemo(
    () => initialPreset(labelType, useHalfPageBRT),
    [labelType, useHalfPageBRT],
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
    if (!file) {
      return;
    }

    void cropPdf(file, preset, offsetX, offsetY);
  }, [file, offsetX, offsetY, preset]);

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
      const message = "Please choose a PDF file.";
      toast.error(message);
      return;
    }

    setFile(nextFile);
  }

  async function handleImportFromUrl() {
    const trimmedUrl = importUrl.trim();

    if (!trimmedUrl) {
      toast.error("Enter a PDF URL.");
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      toast.error("Enter a valid URL.");
      return;
    }

    setIsImportingUrl(true);

    try {
      const response = await fetch(parsedUrl.toString());

      if (!response.ok) {
        throw new Error("The PDF URL could not be fetched.");
      }

      const blob = await response.blob();
      const contentType = response.headers.get("content-type") ?? blob.type;
      const urlPath = parsedUrl.pathname.toLowerCase();
      const looksLikePdf =
        contentType.includes("pdf") || urlPath.endsWith(".pdf");

      if (!looksLikePdf) {
        throw new Error("The provided URL does not point to a PDF.");
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
          : "Failed to import the PDF from this URL.";
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

  async function cropPdf(
    nextFile: File,
    nextPreset: CropPreset,
    horizontalOffset: number,
    verticalOffset: number,
  ) {
    setIsProcessing(true);

    try {
      const arrayBuffer = await nextFile.arrayBuffer();
      const workingPdf = await PDFDocument.load(arrayBuffer);
      const firstPage = workingPdf.getPages()[0];

      if (!firstPage) {
        throw new Error("The PDF does not contain a readable first page.");
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
        throw new Error("The PDF does not contain a processed first page.");
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

      const outputBytes = await outputPdf.save();

      const normalizedBytes = new Uint8Array(outputBytes.length);
      normalizedBytes.set(outputBytes);
      const blob = new Blob([normalizedBytes], { type: "application/pdf" });

      setPdfUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }

        return URL.createObjectURL(blob);
      });
    } catch (cropError) {
      const message =
        cropError instanceof Error
          ? cropError.message
          : "Failed to process this PDF.";
      toast.error(message);
      setPdfUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return "";
      });
    } finally {
      setIsProcessing(false);
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
                  Output
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#082b2b]">
                  PDF preview
                </h2>
              </div>

              {pdfUrl ? (
                <div className="hidden lg:flex lg:justify-end">
                  <ButtonGroup
                    aria-label="PDF actions"
                    className="rounded-full border border-[#16302b20] bg-white shadow-[0_10px_30px_rgba(8,43,43,0.04)]"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearSelectedPdf}
                      className="size-10 shrink-0 border-transparent bg-transparent px-0 text-[#bf3f3f] hover:border-transparent hover:bg-[#fff5f5] hover:text-[#9f2e2e]"
                      aria-label="Remove PDF"
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
                      Replace PDF
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
                        Export PDF
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
                      Print
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
                <div className="flex w-full items-center justify-center sm:p-10 md:h-full md:min-h-0 md:flex-1 md:p-8">
                  <div className="flex size-full h-full items-center justify-center aspect-2/3">
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
                    Drag and drop a PDF
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[#56716a]">
                    Upload an A4 shipping-label PDF
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
                      Choose PDF
                    </Button>
                  </div>
                  <div className="mt-8">
                    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#6a8680]">
                      <span className="h-px flex-1 bg-[#16302b12]" />
                      Or import from URL
                      <span className="h-px flex-1 bg-[#16302b12]" />
                    </div>
                    <div
                      className="mt-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <label className="sr-only" htmlFor="pdf-url">
                        PDF URL
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
                          placeholder="https://example.com/label.pdf"
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
                              ? "Importing PDF"
                              : "Import PDF from URL"
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
                aria-label="Remove PDF"
              >
                <Trash2 size={16} />
              </Button>
              <Button type="button" variant="outline" onClick={openFileDialog}>
                <FileUp size={16} />
                Replace PDF
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
                  Export PDF
                </a>
              </Button>
              <Button type="button" variant="outline" onClick={handlePrint}>
                <Printer size={16} />
                Print
              </Button>
            </div>
          ) : null}
        </div>

        <div className="space-y-6 md:flex md:h-full md:min-h-0 md:flex-col md:overflow-hidden md:order-1">
          <div>
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#1b6b63]">
              Controls
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#082b2b]">
              Crop parameters
            </h2>
          </div>

          <div className="space-y-6 overflow-hidden rounded-[2rem] border border-[#16302b14] bg-[linear-gradient(180deg,#fdfefd_0%,#f6fbfa_100%)] p-5 md:flex md:flex-1 md:flex-col md:overflow-auto">
            <div className="space-y-2">
              <Label htmlFor="label-type">Label type</Label>
              <Select
                value={labelType}
                onValueChange={(value) => setLabelType(value as LabelType)}
              >
                <SelectTrigger id="label-type">
                  <SelectValue placeholder="Choose label type" />
                </SelectTrigger>
                <SelectContent>
                  {LABEL_OPTIONS.map((option) => (
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
                    Use half page
                  </div>
                  <div className="text-sm text-[#56716a]">
                    Switch between the two BRT crop presets.
                  </div>
                </div>
                <Switch
                  checked={useHalfPageBRT}
                  onCheckedChange={setUseHalfPageBRT}
                  className="shrink-0"
                />
              </div>
            ) : null}

            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#56716a]">Horizontal</span>
                  <span className="font-medium text-[#16302b]">{offsetX}</span>
                </div>
                <Slider
                  value={[offsetX]}
                  min={-120}
                  max={120}
                  step={1}
                  onValueChange={([value]) => setOffsetX(value ?? 0)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#56716a]">Vertical</span>
                  <span className="font-medium text-[#16302b]">{offsetY}</span>
                </div>
                <Slider
                  value={[offsetY]}
                  min={-120}
                  max={120}
                  step={1}
                  onValueChange={([value]) => setOffsetY(value ?? 0)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#56716a]">Scale</span>
                  <span className="font-medium text-[#16302b]">
                    {preset.scale.toFixed(2)}x
                  </span>
                </div>
                <Slider
                  value={[scaleOffset]}
                  min={-0.5}
                  max={0.8}
                  step={0.01}
                  onValueChange={([value]) => setScaleOffset(value ?? 0)}
                />
              </div>

              {labelType === "manualEditor" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#56716a]">Rotation</span>
                    <span className="font-medium text-[#16302b]">
                      {preset.rotate}°
                    </span>
                  </div>
                  <Slider
                    value={[rotationOffset]}
                    min={0}
                    max={270}
                    step={90}
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
                  onClick={() => {
                    setOffsetX(0);
                    setOffsetY(0);
                    setScaleOffset(0);
                    setRotationOffset(0);
                  }}
                >
                  Reset adjustments
                </Button>
              </div>
            </div>

            <div className="md:flex-1" />

            <div className="flex justify-center border-t border-[#16302b10] pt-4">
              <Link
                href="/privacy"
                className="text-sm font-medium text-[#56716a] transition-colors hover:text-[#1b6b63]"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
