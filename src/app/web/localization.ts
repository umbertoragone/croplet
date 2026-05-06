import { WEB_APP_NAME } from "@/lib/brand";

export const WEB_LOCALES = ["en", "it"] as const;

export type WebLocale = (typeof WEB_LOCALES)[number];

export type WebMessages = {
  header: {
    product: string;
    badge: string;
    title: string;
  };
  languageSwitcher: {
    label: string;
    placeholder: string;
    options: Record<WebLocale, string>;
  };
  workbench: {
    labelOptions: Record<
      | "posteItaliane"
      | "vintedGo"
      | "brt"
      | "inpostFamily"
      | "ups"
      | "dhl"
      | "manualEditor",
      string
    >;
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
      useHalfPageInfoLabel: string;
      useHalfPageInfoTooltip: string;
      showRecipientName: string;
      showRecipientNameInfoLabel: string;
      showRecipientNameInfoTooltip: string;
      recipientNameSize: string;
      decreaseRecipientNameSize: string;
      increaseRecipientNameSize: string;
      recipientNameSizeAdjustment: string;
      horizontal: string;
      vertical: string;
      scale: string;
      rotation: string;
      resetAdjustments: string;
      donate: string;
      privacy: string;
      viewOnGitHub: string;
    };
  };
};

const messages: Record<WebLocale, WebMessages> = {
  en: {
    header: {
      product: WEB_APP_NAME,
      badge: "Alpha",
      title: 'A4 to 4×6" label cropper',
    },
    languageSwitcher: {
      label: "Language",
      placeholder: "Choose language",
      options: {
        en: "English",
        it: "Italiano",
      },
    },
    workbench: {
      labelOptions: {
        posteItaliane: "Poste Italiane",
        vintedGo: "Poste Italiane (VintedGo)",
        brt: "BRT",
        inpostFamily: "InPost / Mondial Relay / Hermes",
        ups: "UPS",
        dhl: "DHL",
        manualEditor: "Manual crop",
      },
      errors: {
        choosePdf: "Please choose a PDF file.",
        enterPdfUrl: "Enter a PDF URL.",
        enterValidUrl: "Enter a valid URL.",
        fetchPdfUrl: "The PDF URL could not be fetched.",
        urlNotPdf: "The provided URL does not point to a PDF.",
        importFailed: "Failed to import the PDF from this URL.",
        noReadablePage: "The PDF does not contain a readable first page.",
        noProcessedPage: "The PDF does not contain a processed first page.",
        processFailed: "Failed to process this PDF.",
      },
      output: {
        eyebrow: "Output",
        title: "PDF preview",
        actionsLabel: "PDF actions",
        removePdf: "Remove PDF",
        replacePdf: "Replace PDF",
        exportPdf: "Export PDF",
        print: "Print",
        dragTitle: "Drag and drop a PDF",
        dragDescription: "Upload an A4 shipping-label PDF",
        choosePdf: "Choose PDF",
        importDivider: "Or import from URL",
        pdfUrl: "PDF URL",
        pdfUrlPlaceholder: "https://example.com/label.pdf",
        importingPdf: "Importing PDF",
        importPdfFromUrl: "Import PDF from URL",
      },
      controls: {
        eyebrow: "Controls",
        title: "Crop parameters",
        labelType: "Label type",
        chooseLabelType: "Choose label type",
        useHalfPage: "Use half page",
        useHalfPageHint: "Switch between the two BRT crop presets.",
        useHalfPageInfoLabel: "Why this helps",
        useHalfPageInfoTooltip:
          "Prints the barcode in the same direction as the label feed for a better quality.",
        showRecipientName: "Show recipient name",
        showRecipientNameInfoLabel: "Why this helps",
        showRecipientNameInfoTooltip:
          "Prints the recipient name in large text so staff can find the parcel faster at delivery.",
        recipientNameSize: "Recipient name size",
        decreaseRecipientNameSize: "Decrease recipient name size",
        increaseRecipientNameSize: "Increase recipient name size",
        recipientNameSizeAdjustment: "Recipient name size adjustment",
        horizontal: "Horizontal",
        vertical: "Vertical",
        scale: "Scale",
        rotation: "Rotation",
        resetAdjustments: "Reset adjustments",
        donate: "Donate",
        privacy: "Privacy",
        viewOnGitHub: "View on GitHub",
      },
    },
  },
  it: {
    header: {
      product: WEB_APP_NAME,
      badge: "Alpha",
      title: 'Ritaglio etichette da A4 a 4×6"',
    },
    languageSwitcher: {
      label: "Lingua",
      placeholder: "Seleziona lingua",
      options: {
        en: "English",
        it: "Italiano",
      },
    },
    workbench: {
      labelOptions: {
        posteItaliane: "Poste Italiane",
        vintedGo: "Poste Italiane (VintedGo)",
        brt: "BRT",
        inpostFamily: "InPost / Mondial Relay / Hermes",
        ups: "UPS",
        dhl: "DHL",
        manualEditor: "Ritaglio manuale",
      },
      errors: {
        choosePdf: "Seleziona un file PDF.",
        enterPdfUrl: "Inserisci un URL PDF.",
        enterValidUrl: "Inserisci un URL valido.",
        fetchPdfUrl: "Non è stato possibile recuperare l'URL del PDF.",
        urlNotPdf: "L'URL fornito non punta a un PDF.",
        importFailed: "Impossibile importare il PDF da questo URL.",
        noReadablePage: "Il PDF non contiene una prima pagina leggibile.",
        noProcessedPage: "Il PDF non contiene una prima pagina elaborata.",
        processFailed: "Impossibile elaborare questo PDF.",
      },
      output: {
        eyebrow: "Output",
        title: "Anteprima PDF",
        actionsLabel: "Azioni PDF",
        removePdf: "Rimuovi PDF",
        replacePdf: "Sostituisci PDF",
        exportPdf: "Esporta PDF",
        print: "Stampa",
        dragTitle: "Trascina un PDF qui",
        dragDescription:
          "Carica un PDF di etichetta di spedizione in formato A4",
        choosePdf: "Scegli PDF",
        importDivider: "Oppure importa da URL",
        pdfUrl: "URL PDF",
        pdfUrlPlaceholder: "https://example.com/label.pdf",
        importingPdf: "Importazione PDF",
        importPdfFromUrl: "Importa PDF da URL",
      },
      controls: {
        eyebrow: "Controlli",
        title: "Parametri di ritaglio",
        labelType: "Tipo di etichetta",
        chooseLabelType: "Seleziona tipo di etichetta",
        useHalfPage: "Usa mezza pagina",
        useHalfPageHint: "Passa tra i due preset di ritaglio BRT.",
        useHalfPageInfoLabel: "Perché aiuta",
        useHalfPageInfoTooltip:
          "Stampa il codice a barre nella stessa direzione di uscita dell'etichetta per una migliore qualità.",
        showRecipientName: "Mostra nome destinatario",
        showRecipientNameInfoLabel: "Perché aiuta",
        showRecipientNameInfoTooltip:
          "Stampa il nome del destinatario in grande per consentire agli addetti di trovare il pacco più velocemente alla consegna.",
        recipientNameSize: "Dimensione nome destinatario",
        decreaseRecipientNameSize: "Riduci dimensione nome destinatario",
        increaseRecipientNameSize: "Aumenta dimensione nome destinatario",
        recipientNameSizeAdjustment: "Regolazione dimensione nome destinatario",
        horizontal: "Orizzontale",
        vertical: "Verticale",
        scale: "Scala",
        rotation: "Rotazione",
        resetAdjustments: "Reimposta regolazioni",
        donate: "Dona",
        privacy: "Privacy",
        viewOnGitHub: "Vedi su GitHub",
      },
    },
  },
};

export function resolveWebLocale(
  locale: string | string[] | undefined,
): WebLocale {
  const candidate = Array.isArray(locale) ? locale[0] : locale;
  return candidate === "it" ? "it" : "en";
}

export function getWebMessages(locale: WebLocale) {
  return messages[locale];
}
