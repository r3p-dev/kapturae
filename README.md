# Kapturae

A photo booth that runs in the browser. Live at [kapturae.r3p.dev](https://kapturae.r3p.dev).

Pick a print size and a frame, take a few photos, decorate them, and download a print-ready sheet or a GIF. Photos never
leave the device: capture, editing and export all happen in the browser. The server only sends the app's files.

## Features

- Three print sizes (2×6 strip, 4×6, 5×7) with 16 frames each.
- Camera with a 3 or 5 second timer, mirroring, and front/back switching. Photos can also come from the device (JPG,
  PNG, HEIC).
- Editor: pan and zoom each photo, brightness, contrast, saturation, warmth, grain, 12 filters, text, a brush, frame
  colour, and undo/redo.
- Stickers, built in or from your own image. Imported images can be cropped, and their background removed if you want.
- Downloads: a 300 DPI PNG, an animated GIF made from a short burst recorded around each shot, and a ZIP with every
  version. Where the browser can share files, a Share button hands the file to other apps.
- English and Indonesian.

## How photos stay on the device

- No server route accepts data. The only endpoints are `/health` and `/sitemap.xml`.
- While a session is open, its state is kept in `sessionStorage`, and the photos themselves in IndexedDB, so a reload
  doesn't lose work. Starting a new session or leaving it clears both. If a tab is closed mid-session, whatever it left
  in IndexedDB is deleted the next time the site is opened. Web Locks tell open tabs apart from closed ones.
- The Content Security Policy sets `connect-src 'self'`.
- A service worker caches the app's own files, so once the page has loaded a whole session works offline. It never
  touches photos.

`tests/unit/network.test.ts` fails if code that sends requests is added, and the end-to-end suite runs a full session
offline, checking that every request is a same-origin `GET` with no body.

## Development

Needs [Bun](https://bun.sh) 1.4 or newer.

```sh
bun install
bun run dev
```

| Command              | What it does                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `bun run dev`        | Dev server                                                                                           |
| `bun run build`      | Production build into `build/`                                                                       |
| `bun run check`      | Type-check Svelte, TypeScript and the build scripts                                                  |
| `bun run lint`       | Prettier and ESLint                                                                                  |
| `bun run test`       | Unit tests                                                                                           |
| `bun run test:build` | Build, then test the running server: headers, SEO tags, sitemap, JavaScript budget                   |
| `bun run test:e2e`   | Build, then run Playwright with a fake camera (install once with `bunx playwright install chromium`) |

The home page has to stay under 96 KB of gzipped JavaScript. `test:build` measures every route and fails when one grows
past its limit.

## Layout

```
src/routes/                 landing page, /legal/[doc], /session/{frame,shoot,edit,done}
src/lib/shots.svelte.ts     session state shared by the steps
src/lib/session-store.ts    saves and restores a session (sessionStorage + IndexedDB)
src/lib/outputs.ts          renders the PNG, GIFs and per-photo files
src/lib/sticker-cutout.ts   crop maths and background removal for imported stickers
src/lib/seo.ts              canonical URLs, hreflang and structured data
static/frames/<size>/       frame artwork
messages/{en,id}.json       all text in both languages
```

## Adding a frame

Put a PNG in `static/frames/2x6`, `4x6` or `5x7`. Photos go wherever the image is transparent: `scripts/frames.ts`
finds those areas at build time, orders them top to bottom and left to right, and takes the frame's name from the file
name. No list to update.

## Running in production

`bun run build` produces a Bun server in `build/`. Start it with `bun build/index.js`. It listens on `PORT` (default 3000) and `HOST`. The `Dockerfile` builds the same thing into an image. The server keeps no files, so the container
needs no volume.

The "last updated" date on the legal pages comes from git history. When building without it, pass `LEGAL_UPDATED`
(`YYYY-MM-DD`).

## Getting found on Google

The site ships a canonical URL and `hreflang` links on every page, a sitemap, `robots.txt`, and `WebSite` structured
data that names it Kapturae. Session pages are `noindex`. What the code can't do:

1. Add `kapturae.r3p.dev` as a domain property in [Google Search Console](https://search.google.com/search-console)
   and verify it with the DNS record it gives you.
2. Submit `https://kapturae.r3p.dev/sitemap.xml` under Sitemaps.
3. Use URL Inspection → Request indexing for `https://kapturae.r3p.dev/` and `https://kapturae.r3p.dev/id`.
4. Link to the site from places Google already crawls: the GitHub repository's website field, your portfolio, any
   profile you have.

A new site usually takes a few days to a few weeks to show up for its own name.
