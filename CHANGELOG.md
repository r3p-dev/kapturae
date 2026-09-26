# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-26

### Added

- Fully client-side photo booth workflow (`/session/frame`, `/session/shoot`, `/session/edit`, `/session/done`) built on SvelteKit 2, Svelte 5 runes, and `@sveltejs/adapter-static`.
- Build-time photo slot auto-detection (`scripts/frames.ts`) across 48 frames in `2x6` (strip), `4x6` (standard), and `5x7` (large) print sizes.
- Live camera capture with 3s/5s countdown timer, mirror toggle, front/back camera switching, hardware torch support, shutter sound, burst recording for animated GIFs, and single-slot retakes.
- Device photo upload supporting JPEG, PNG, and HEIC/HEIF up to 20 MB with automatic orientation and downscaling.
- Interactive photo editor with per-slot zoom and pan, slot swapping, 5 image adjustments (brightness, contrast, saturation, warmth, grain), 11 filter presets with intensity control, frame recolouring, 3 text fonts, freehand brush and eraser, and undo/redo history.
- 24 built-in vector stickers plus custom sticker import with interactive cropping and client-side flood-fill background removal.
- Frame-only zoom wrapper (`frame-zoom.svelte`) supporting mobile two-finger pinch, desktop Ctrl/⌘ + wheel and trackpad pinch, double-click 1× ↔ 2× toggle at cursor, and keyboard (`+`, `-`, `0`) controls without scaling page chrome.
- High-resolution client-side export generating 300 DPI print-ready PNG sheets, animated GIF sheets and per-slot loops (`gifenc`), and bundled ZIP archives (`fflate`), plus native Web Share API support.
- Full English (`/`) and Indonesian (`/id`) localisation via Paraglide JS, including localized web app manifests, SEO metadata, structured data, and build-time `sitemap.xml`.
- Offline-capable Progressive Web App service worker with versioned cache eviction and install prompt support.
- Comprehensive privacy and legal documentation (`privacy`, `terms`, `deletion`, `camera`, `data`, `contact`) with automated git-based last-updated timestamps.
- Automated unit, build (CSP, headers, routing, and gzipped JS bundle budgets), and Playwright offline end-to-end test suites in CI, plus Tailscale + rsync continuous deployment.

### Removed

- Legacy server-side share routes (`/p/[id]`, `/api/share`), upload endpoints, and container deployment artifacts in favour of a zero-server, local-only architecture (`sessionStorage` + IndexedDB with Web Locks tab cleanup).
