[![Netlify Status](https://api.netlify.com/api/v1/badges/933545f2-8a85-463f-8467-e7cb78984585/deploy-status)](https://app.netlify.com/projects/croplet/deploys)

# Croplet

Croplet is the public site and product home for Croplet Web and the iOS app.

Croplet Web is a browser-based A4 shipping-label PDF cropper built for desktop workflows. It imports a label PDF, detects the carrier when possible, applies a carrier-specific crop preset, and exports a clean 4x6" PDF ready for thermal printing.

It is designed for users who:

- process shipping labels from a laptop or desktop browser
- want fast drag-and-drop or URL-based import
- need manual control when a label does not match a preset perfectly
- print to 4x6" thermal printers without a separate desktop app

Website: https://croplet.app
Web app: https://croplet.app/web
iOS app: https://apps.apple.com/us/app/croplet/id6760548549

## Croplet Web

Croplet Web handles the full label workflow in-browser:

1. Import an A4 shipping-label PDF from disk, by drag and drop, or from a direct PDF URL.
2. Croplet reads the first page and detects the label type when possible.
3. The app applies a crop preset for the detected carrier or for the label type you choose manually.
4. You fine-tune the crop with offset, scale, rotation, and carrier-specific options.
5. The result is rendered as a 4x6" PDF that can be downloaded or printed.

## How Cropping Works

Croplet Web uses two different layers:

- Preview rendering: the imported PDF is displayed in the browser with `react-pdf` and the PDF.js worker used by `react-pdf`.
- Final export: the output PDF is generated with `pdf-lib` in the browser, without sending the file to Croplet servers for local file imports.

The crop pipeline works like this:

1. The source PDF is loaded in memory.
2. Croplet selects the first page.
3. A crop preset defines the label frame for the chosen carrier.
4. Horizontal and vertical offsets shift the crop target.
5. Scale changes how much of the source page is embedded into the final 4x6" page.
6. Rotation adjusts the final orientation.
7. The page is embedded into a new 4x6" PDF page and exported.

For Poste Italiane labels, Croplet can also place the recipient name into the exported output when that option is enabled.

## Import Workflow

Croplet Web supports three import paths:

- Drag and drop a PDF into the drop zone.
- Choose a local PDF file from the file picker.
- Paste a direct PDF URL and let Croplet fetch it through the server-side import route, then convert it into a local file for processing.

After import, Croplet automatically:

- validates that the file is a PDF
- detects the label type when possible
- loads the first page into the preview
- starts the crop pass for the selected preset

URL import is the only path that uses Croplet infrastructure. It runs through the Netlify server function behind `/api/import-from-url`, which fetches the remote PDF and streams it back to the browser. The file is not stored as part of the normal flow.

For operational monitoring and abuse prevention, the URL-import function writes short structured logs to Netlify. These logs include the endpoint name, event name, remote hostname, protocol, detected file extension, response content type, response byte size, and the reason for blocked or failed requests. For rate-limited requests, the log also includes the client IP address seen by the function so repeated abusive traffic can be identified. Croplet does not intentionally log the full submitted URL, URL query string, or PDF contents. Netlify retains function logs for 24 hours.

This server-side step is useful when the label host does not allow direct browser fetches. Vinted is a common example: its shipping labels are often hosted on S3-backed URLs that may be blocked by cross-origin rules when you try to load them directly in the browser. Other platforms can behave the same way, so the proxy keeps URL import usable when a direct client-side fetch would fail.

If you want full privacy, do not use URL import. Download the PDF from Vinted first, then import it as a local file or via drag and drop. Those paths stay in your browser on your device.

## Cropping Parameters

Use these controls to fine-tune the crop:

- Label type: choose the shipping carrier preset.
- Use half page: switches between the two BRT presets.
- Horizontal: moves the crop left or right.
- Vertical: moves the crop up or down.
- Scale: zooms the cropped region in or out.
- Rotation: rotates the manual editor in 90° steps.
- Show recipient name: toggles the Poste Italiane recipient-name overlay.
- Recipient name size: adjusts the font size of that overlay.

The crop sliders are centered on a zero point so it is easy to return to the default preset.

For Poste Italiane labels, Croplet can extract the recipient name and print it again in larger text at the top of the final label. The original label often uses a very small font for that information, which can be hard to read once the label is printed or stacked with many other parcels. Croplet places the name into the blank unused space at the top of the output label, so that space is turned into a visible identifier instead of being wasted.

That helps postal operators, Punto Poste staff, and post-office workers identify the parcel faster and match it to the final recipient when many packages are being handled at once.

It also helps when a thermal printer is not perfectly calibrated, or when a small dust particle lands on the thermal paper before printing. In those cases, the tiny recipient-name text on the original Poste Italiane label can become even harder to read, so printing that name again in a larger, cleaner form reduces the chance of confusion for the people handling the package.

## Manual Mode

Manual mode is meant for labels that need direct positioning instead of a carrier preset.

In manual mode:

- apply a rotation if the source page orientation needs adjustment
- drag the PDF preview on the canvas to reposition the page inside the 4x6" output
- use the scroll wheel over the preview to zoom in or out, or use the scale control instead to fine-tune the zoom level
- use the horizontal and vertical controls to correct the final position

Manual mode is intentionally interactive. The preview uses a grab cursor, and the crop updates while you drag or zoom so you can visually align the label before export.

## Roadmap

- [ ] Multiple PDF selection support
- [ ] Bulk processing workflow (for users who need to process the same type of labels in large batches)

## Contributing

If you want to contribute to the web tool, feel free to open a PR.

Good examples of useful contributions are:

- new default crop parameters for additional couriers or shipping label layouts
- new language translations
- improvements to label detection, cropping, and export
- fixes or UX improvements for high-volume desktop use
