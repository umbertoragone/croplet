# Croplet

Marketing site for Croplet, an iOS app that converts A4 shipping label PDFs into 4x6 inch thermal-printer labels.

The site is built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4. It currently includes a landing page and a privacy policy page.

## Pages

- `/` landing page with product messaging, screenshots, features, pricing, and App Store CTA
- `/privacy` privacy policy page for the iOS app

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- `lucide-react` for icons

## Requirements

- Node.js 20+ or Bun

## Development

Install dependencies:

```bash
bun install
```

Start the development server:

```bash
bun run dev
```

Open `http://localhost:3000`.

If you prefer npm:

```bash
npm install
npm run dev
```

## Available Scripts

```bash
bun run dev
bun run build
bun run start
bun run lint
```

## Project Structure

```text
src/app/
  components/PhoneFrame.tsx
  globals.css
  layout.tsx
  page.tsx
  privacy/page.tsx
public/
  black.svg
  icon.png
  iphone-bezel.png
  screenshots/
```

## Notes

- The site uses the App Router under `src/app`.
- Metadata is configured in `src/app/layout.tsx`.
- The homepage references static assets from `public/`, including App Store artwork and screenshots.
- `next.config.ts` enables the React Compiler.
