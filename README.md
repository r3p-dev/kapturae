# Kapturae

A free photo booth that runs entirely in the browser, in English and Indonesian. Pick a print size and a frame, take a
few photos, decorate them, and download a print-ready sheet or an animated GIF. Capture, editing and export all happen
on the device; photos are never uploaded.

Live at [kapturae.r3p.dev](https://kapturae.r3p.dev).

## Features

- **Print sizes and frames:** 2×6 strip, 4×6 and 5×7, with 16 frames each. Every frame has its own photo slots.
- **Camera:** 3 or 5 second timer, mirroring, front/back switching, flash (torch where available) and shutter sound.
  Photos can also come from the device: JPG, PNG, or HEIC where the browser can decode it, up to 20 MB.
- **Editor:** pan and zoom each photo, swap slots, retake a single slot. Brightness, contrast, saturation, warmth and
  grain, 11 filter presets with intensity, text in three fonts, a brush with an eraser, frame recolouring, and
  undo/redo.
- **Stickers:** 24 built-in stickers, or your own images. Imported images can be cropped and, optionally, have their
  background removed in the browser.
- **Export:** a 300 DPI PNG of the print, GIFs made from a short burst recorded during each countdown, and a ZIP of
  every output. Where the browser can share files (Web Share), a Share button hands the file to another app.
- **Languages:** English at `/`, Indonesian at `/id`.
- **Installable:** a web app manifest per language, icons (including maskable) and iOS home-screen tags. An "Install
  app" button appears in the landing header when the browser offers installation.
- **Offline:** once the service worker has installed, a whole session works without a connection.

## Privacy architecture

Everything happens on the device. The design goal is that the server has nothing to receive and nothing to log.

- **No server code.** The build is static files. The only endpoint, `sitemap.xml`, is rendered at build time. There are
  no uploads, accounts or analytics.
- **No cookies.** The language comes from the URL only (Paraglide's `url` strategy).
- **No third-party requests.** Fonts (`@fontsource`) and icons (`remixicon-svelte`) are bundled with the app.
- **Content Security Policy.** Every page carries a CSP `<meta>` tag with `default-src 'self'`, `connect-src 'self'`
  and hashes for SvelteKit's inline scripts. The server only adds what a `<meta>` tag can't carry
  (`frame-ancestors 'none'`).
- **Browser storage**, all on the device:

  | Storage          | Holds                                          | Cleared                                                                                                                          |
  | ---------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
  | `sessionStorage` | Session state (size, frame, edits)             | When a new session starts, the session is ended, or the tab closes                                                               |
  | IndexedDB        | Photos, GIF bursts and stickers of the session | Same as above. A closed tab can't clean up, so its data is deleted the next time any page opens (Web Locks tell live tabs apart) |
  | Cache Storage    | The app's own files, for offline use           | Replaced by every new build. Never holds photos                                                                                  |

- **Service worker** ([`src/service-worker.ts`](src/service-worker.ts)):
  - Each build gets its own cache (`kapturae-<version>`), and the new worker deletes older caches when it activates.
  - Build assets and static files are cache-first. Pages and everything else are network-first, with the cached copy
    as a fallback.
  - It only handles same-origin `GET` requests. Photos only ever exist as `blob:` URLs and IndexedDB entries, so they
    never pass through it.

Tests keep this in place:

- `tests/unit/network.test.ts` fails if code that sends requests, an absolute URL to another origin, or a new
  endpoint is added.
- The end-to-end suite runs a full session offline and checks that every request is a same-origin `GET` with no body.

The user-facing policy is on the [legal pages](https://kapturae.r3p.dev/legal/privacy).

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) 2 with Svelte 5 runes, built with `@sveltejs/adapter-static` on Vite
- [Tailwind CSS](https://tailwindcss.com) 4, with [bits-ui](https://bits-ui.com) /
  [shadcn-svelte](https://shadcn-svelte.com) primitives and Remix Icon
- [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) 2 for translations
- `gifenc` for GIFs and `fflate` for ZIPs, both loaded on demand
- [Bun](https://bun.sh) as package manager, script runner and unit test runner. [Playwright](https://playwright.dev)
  for end-to-end tests
- TypeScript, ESLint and Prettier

## Project structure

```
src/
  routes/                       landing page, /legal/[doc], /session/{frame,shoot,edit,done}, sitemap.xml
  lib/
    capture/                    camera, burst recorder, photo import, shoot-step state
    session/                    print sizes and frame types, shared session state (shots)
    storage/                    object-URL registry, sessionStorage + IndexedDB persistence
    frames/                     frame list, URL lookup, recolouring
    editor/                     edit model (filters, history), edit-step state, stage gestures
    stickers/                   built-in stickers, crop and background removal for imported ones
    export/                     renders the PNG, GIFs and per-photo files
    i18n/                       message maps for session labels
    site/                       SEO helpers (canonical URLs, hreflang, JSON-LD) and legal document list
    components/
      atoms/ molecules/ organisms/   shared components
      landing/                  landing page sections
      session/{shoot,edit}/     sections of the shoot and edit steps
      ui/                       shadcn-svelte primitives
    paraglide/                  generated by Paraglide (git-ignored)
  service-worker.ts             offline cache
messages/{en,id}.json           all text in both languages
static/                         icons, manifests, Open Graph images, frame artwork
scripts/
  frames.ts                     Vite plugin that finds the photo slots in each frame
  hosting.ts                    required headers and routing rules for any host
  serve_build.ts                serves build/ with those rules (tests and `bun run serve`)
  legal_updated.ts              "last updated" date for the legal pages
tests/{unit,build,e2e}/
```

Session steps are client-rendered (`ssr = false`) and marked `noindex`. The landing page and legal pages are
prerendered in both languages.

## Getting started

You need [Bun](https://bun.sh). The end-to-end tests also need Playwright's Chromium.

```sh
bun install
bun run dev
bunx playwright install chromium   # once, before bun run test:e2e
```

The camera needs a secure context. `localhost` counts; other hosts need HTTPS.

### Scripts

| Command               | What it does                                                         |
| --------------------- | -------------------------------------------------------------------- |
| `bun run dev`         | Vite dev server                                                      |
| `bun run build`       | Static site in `build/`                                              |
| `bun run preview`     | Vite's preview of the production build                               |
| `bun run serve`       | Serve `build/` on port 4173 with the production headers and routing  |
| `bun run check`       | Compile messages, then type-check Svelte, TypeScript and the scripts |
| `bun run check:watch` | The same, in watch mode                                              |
| `bun run lint`        | Prettier check and ESLint                                            |
| `bun run format`      | Format everything with Prettier                                      |
| `bun run paraglide`   | Compile `messages/` into `src/lib/paraglide`                         |
| `bun run test`        | Unit tests (`tests/unit`)                                            |
| `bun run test:build`  | Build, then test the output (`tests/build`)                          |
| `bun run test:e2e`    | Build, then run Playwright (`tests/e2e`)                             |

`prepare` runs `svelte-kit sync` after install.

### Adding a frame

Put a PNG in `static/frames/2x6`, `4x6` or `5x7`. Photos go wherever the image is transparent: `scripts/frames.ts`
finds those areas at build time, orders them top to bottom and left to right, and names the frame after the file. There
is no list to update.

### Translations

All text lives in `messages/en.json` and `messages/id.json`, with the same keys in both. The "last updated" date on the
legal pages comes from the git history of the `legal` messages. When building without history, set
`LEGAL_UPDATED=YYYY-MM-DD`; without either, the date is left out.

## Testing

- **Unit** (`bun run test`): network surface, SEO helpers, session media packing, sticker crop and background removal.
- **Build** (`bun run test:build`):
  - the prerendered files and the CSP of every page
  - the hosting rules (headers, routing, 404, methods)
  - SEO tags and the sitemap
  - manifests and icons
  - caching and the JavaScript budget
- **End-to-end** (`bun run test:e2e`): Playwright with a fake camera.
  - a full session offline, with a check that nothing is sent
  - imported stickers
  - restoring after a reload, and clean-up of abandoned media
  - one cache per build
  - Chrome's installability checks in both languages, and the install button

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs lint, type check, unit, build and end-to-end tests on
every push to `main` and on pull requests.

### JavaScript budget

`test:build` adds up the gzipped JavaScript each route loads (entry chunks plus the route's own chunks). It fails when a
route goes over its cap:

| Route                                               | Cap    |
| --------------------------------------------------- | ------ |
| `/` (landing)                                       | 96 KB  |
| `/legal/[[doc]]`, `/session/frame`, `/session/done` | 96 KB  |
| `/session/shoot`                                    | 115 KB |
| `/session/edit`                                     | 125 KB |

The target is 96 KB everywhere. Only the camera and editor steps may go over it, up to their caps. Heavy code that
isn't needed on first paint (GIF and ZIP encoders, the sticker importer) is loaded on demand.

## Hosting

`bun run build` produces a static site in `build/`, with `.br` and `.gz` copies next to each compressible file. Any
static host works if it follows the rules in [`scripts/hosting.ts`](scripts/hosting.ts). That file is the single
source of truth: `bun run serve` implements it, and `test:build` checks the output against it.

- **Headers on every response:**
  - `Content-Security-Policy` (`frame-ancestors` only; the rest is in each page's `<meta>`)
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy` (camera allowed for the site itself only)
  - `Strict-Transport-Security`
- **Caching:** files under `/_app/immutable/` are cached for a year as immutable. Everything else, including
  `service-worker.js`, is `no-cache` so a new build is picked up.
- **Routing:** for a request path, serve the first file that exists out of `path`, `path.html` and
  `path/index.html`. Otherwise serve `404.html` with status 404.
- **Methods:** only `GET` and `HEAD`.
- **Content types:** `.webmanifest` as `application/manifest+json` and `.xml` as `application/xml`.
- **HTTPS**, since the camera and the service worker need a secure context.
- **No access logs.** The privacy policy states that the web server keeps none, so don't enable request logging.

Serving the precompressed `.br`/`.gz` files is optional but recommended.
