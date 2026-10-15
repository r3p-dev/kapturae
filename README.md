# Kapturae

A free photo booth that runs entirely in your browser. Pick a frame, take a few photos, decorate them, and take home a
print-ready sheet or an animated GIF. No app to install, no account to make, and your photos never leave your device.

Visit it at **[kapturae.r3p.dev](https://kapturae.r3p.dev)**.

## What you can do

- **Choose a frame**: three print sizes (a 2×6 strip, 4×6 and 5×7), each with 16 frames to pick from.
- **Take your photos**: a 3 or 5 second countdown, a mirrored preview, front and back cameras, a flash where your
  device has one, and a shutter sound. You can also use photos already on your device (JPG, PNG or HEIC, up to 20 MB).
- **Make them yours**: move and zoom each photo, swap or retake a single one, adjust brightness, contrast, saturation,
  warmth and grain, or try one of 11 filters. Add text, draw with a brush, recolour the frame, and undo anything.
- **Add stickers**: 24 built-in stickers, or your own pictures, which you can crop and cut out from their background
  right in the browser.
- **Take it home**: download a 300 DPI print-ready PNG, animated GIFs made from each countdown, or everything in one
  ZIP. On phones, share straight to another app.

## Your photos stay with you

- **Nothing is uploaded.** Capturing, editing and exporting all happen on your device.
- **Nothing is tracked.** There are no cookies, no analytics and no requests to other websites. Even the fonts and
  icons come from the site itself.
- **Nothing is kept.** Your session is cleared when you start a new one, end it, or close the tab, and the web server
  keeps no access logs.

The full details are on the [privacy page](https://kapturae.r3p.dev/legal/privacy).

## Made to be easy to use

- **Two languages.** The whole site is available in English and Bahasa Indonesia.
- **Works offline.** Once the site has loaded, a whole session works without a connection.
- **Install it.** Add Kapturae to your home screen or desktop and open it like any other app.

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) and [Svelte](https://svelte.dev) for building the pages
- [TypeScript](https://www.typescriptlang.org) for the code
- [Tailwind CSS](https://tailwindcss.com) and [shadcn-svelte](https://shadcn-svelte.com) for the styling
- [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) for the translations
- [Playwright](https://playwright.dev) for testing a full session in a real browser
- [Bun](https://bun.sh) for running everything

## Run it yourself

You will need [Bun](https://bun.sh) installed. Then:

```sh
git clone https://github.com/r3p-dev/photobooth.git
cd photobooth
bun install
bun dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to see the site.

To add a frame, drop a PNG into `static/frames/2x6`, `4x6` or `5x7`. The photos go wherever the image is transparent,
so there is nothing else to edit.

If you host your own copy, serve it with the headers and routing in [`scripts/hosting.ts`](scripts/hosting.ts) and
keep access logs turned off, since the privacy policy promises there are none.

## Get in touch

I am open to interesting work and conversations.

- Email: [repiyan@r3p.dev](mailto:repiyan@r3p.dev)
- GitHub: [r3p-dev](https://github.com/r3p-dev)
- LinkedIn: [Muhamad Repiyan](https://linkedin.com/in/muhamad-repiyan)
