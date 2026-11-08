# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-08

### Added

- Complete client-side photobooth engine with Svelte 5 and SvelteKit.
- 48 built-in frame templates across 3 print sizes (2x6 strip, 4x6, and 5x7).
- In-browser interactive photo editor with zoom, pan, slot swapping, adjustments, and 11 color presets.
- Custom sticker creator with client-side edge-sampling flood-fill background removal (`cutout.ts`).
- Animated GIF generation during countdown burst via `gifenc`.
- High-resolution 300 DPI PNG composite export and ZIP bundle creation via `fflate`.
- Offline-ready PWA support and bilingual localization (EN/ID via Paraglide JS).
- CC BY-NC-SA 4.0 licensing and SemVer baseline.
