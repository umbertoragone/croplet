# Croplet Web Plan

## Delivery shape

- Keep marketing at `croplet.app`.
- Serve the working app from `web.croplet.app`.
- Route the subdomain into the `/web` tree with `src/proxy.ts`.
- Keep the first browser version local-first: files stay in the browser unless a future feature explicitly needs a backend.

## Why this shape

- It gives the product a clear split between acquisition and usage.
- Desktop users land directly in the tool instead of the marketing page.
- The web app can have its own metadata, manifest, and service worker without turning the root site into an app shell.

## What exists in this repo now

- Subdomain rewrite support for `web.*` hosts.
- A dedicated `/web` route tree for the app shell.
- `manifest.webmanifest` generated from `src/app/manifest.ts`.
- A minimal `public/sw.js` service worker and registration in the web layout.

## What still needs to be built

1. PDF ingestion and page rendering in the browser.
2. Label detection and crop logic shared with or ported from the iOS app.
3. Export flow for 4x6 PDF and PNG outputs.
4. A print workflow tuned for desktop thermal-printer usage.

## Hosting note

- Netlify supports assigning multiple custom domains to one production site and also supports subdomain configuration with external DNS.
- If `croplet.app` already points at this site on Netlify, add `web.croplet.app` as another domain on the same site and point its DNS to Netlify.
