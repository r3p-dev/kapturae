import { GRAIN, filterCss, filterTint, isFiltered, type Edit, type SlotEdit } from '$lib/editor.svelte'
import { LOOP_DELAY, LOOP_FRAMES, sampleIndexes } from '$lib/burst'
import { SIZES, type Frame, type FrameSlot } from '$lib/session'
import { isStickerId, stickerSrc } from '$lib/stickers'

export type OutputCategory = 'plain' | 'filtered' | 'frame-filtered' | 'frame'

export type Output = {
	key: string
	kind: 'png' | 'jpg' | 'gif'
	category: OutputCategory
	index?: number
	blob: Blob
}

export type OutputSpec = {
	frame: Frame
	artwork: string
	photos: string[]
	bursts: string[][]
	edit: Edit
}

const DPI = 300
const JPEG_QUALITY = 0.92
const SHEET_GIF_SIDE = 720
const SLOT_GIF_SIDE = 480
const SLIDESHOW_SIDE = 720
const SLIDESHOW_DELAY = 500
const GRAIN_TILE = 400
const STICKER_PX = 512

const FONTS = {
	bold: (px: number) => `800 ${px}px "Archivo Variable"`,
	mono: (px: number) => `400 ${px}px "IBM Plex Mono"`,
	serif: (px: number) => `italic 400 ${px}px ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`
}

type Box = { x: number; y: number; w: number; h: number }

const images = new Map<string, Promise<HTMLImageElement>>()

function loadImage(src: string) {
	let job = images.get(src)
	if (!job) {
		const image = new Image()
		image.src = src
		job = image.decode().then(() => image)
		images.set(src, job)
		job.catch(() => images.delete(src))
	}
	return job
}

function canvas(width: number, height: number) {
	const el = document.createElement('canvas')
	el.width = Math.round(width)
	el.height = Math.round(height)

	const ctx = el.getContext('2d', { willReadFrequently: true })
	if (!ctx) throw new Error('2D canvas unavailable')
	ctx.imageSmoothingQuality = 'high'

	return { el, ctx }
}

function toBlob(el: HTMLCanvasElement, type = 'image/png', quality?: number) {
	return new Promise<Blob>((resolve, reject) =>
		el.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed'))), type, quality)
	)
}

function overlay(
	ctx: CanvasRenderingContext2D,
	box: Box,
	mode: GlobalCompositeOperation,
	alpha: number,
	fill: string | CanvasPattern
) {
	ctx.save()
	ctx.globalCompositeOperation = mode
	ctx.globalAlpha = alpha
	ctx.fillStyle = fill
	ctx.fillRect(box.x, box.y, box.w, box.h)
	ctx.restore()
}

async function drawPhoto(
	ctx: CanvasRenderingContext2D,
	src: string,
	box: Box,
	slot: SlotEdit | null,
	pan: SlotEdit | null
) {
	const image = await loadImage(src)
	const { zoom, x, y } = pan ?? { zoom: 100, x: 0, y: 0 }
	const cover = Math.max(box.w / image.naturalWidth, box.h / image.naturalHeight) * (zoom / 100)
	const w = image.naturalWidth * cover
	const h = image.naturalHeight * cover

	ctx.save()
	ctx.beginPath()
	ctx.rect(box.x, box.y, box.w, box.h)
	ctx.clip()
	ctx.filter = slot ? filterCss(slot.filter, slot.intensity, slot) : 'none'
	ctx.drawImage(image, box.x + ((box.w - w) * (1 - x)) / 2, box.y + ((box.h - h) * (1 - y)) / 2, w, h)
	ctx.restore()

	if (!slot) return

	const tint = filterTint(slot.filter, slot.intensity)
	if (tint) overlay(ctx, box, 'soft-light', tint.opacity, tint.color)
	if (slot.warmth) overlay(ctx, box, 'soft-light', Math.abs(slot.warmth) / 200, slot.warmth > 0 ? '#ff8a1f' : '#2f7bff')

	if (slot.grain) {
		const pattern = ctx.createPattern(await loadImage(GRAIN), 'repeat')
		if (pattern) {
			pattern.setTransform(new DOMMatrix().scale(ctx.canvas.width / GRAIN_TILE))
			overlay(ctx, box, 'overlay', (slot.grain / 100) * 0.6, pattern)
		}
	}
}

async function drawItems(ctx: CanvasRenderingContext2D, edit: Edit, width: number, height: number) {
	const unit = width / 100

	ctx.save()
	ctx.lineCap = 'round'
	ctx.lineJoin = 'round'
	for (const stroke of edit.strokes) {
		ctx.strokeStyle = stroke.color
		ctx.lineWidth = stroke.width * unit
		ctx.beginPath()
		for (let i = 0; i < stroke.points.length; i += 2) ctx.lineTo(stroke.points[i] * unit, stroke.points[i + 1] * unit)
		ctx.stroke()
	}
	ctx.restore()

	for (const it of edit.items) {
		const x = (it.x / 100) * width
		const y = (it.y / 100) * height

		if (it.kind === 'sticker') {
			const image = await loadImage(isStickerId(it.sticker) ? stickerSrc(it.sticker, STICKER_PX) : it.sticker)
			const w = it.size * unit
			const h = (w * image.naturalHeight) / image.naturalWidth
			ctx.drawImage(image, x - w / 2, y - h / 2, w, h)
			continue
		}

		const px = it.size * unit
		const font = FONTS[it.font](px)
		await document.fonts?.load(font, it.text)

		ctx.save()
		ctx.font = font
		ctx.fillStyle = it.color
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		if (it.font === 'bold') {
			ctx.fontStretch = 'semi-expanded'
			ctx.letterSpacing = `${px * 0.08}px`
		}
		ctx.fillText(it.text, x, y)
		ctx.restore()
	}
}

async function paintSheet(
	ctx: CanvasRenderingContext2D,
	{ frame, artwork, edit }: OutputSpec,
	sources: (string | undefined)[],
	filtered: boolean
) {
	const { width, height } = ctx.canvas
	const box = (s: FrameSlot): Box => ({
		x: (s.x / 100) * width,
		y: (s.y / 100) * height,
		w: (s.w / 100) * width,
		h: (s.h / 100) * height
	})

	ctx.clearRect(0, 0, width, height)
	for (const [i, src] of sources.entries()) {
		const slot = edit.slots[i]
		if (src) await drawPhoto(ctx, src, box(frame.slots[i]), filtered ? slot : null, slot)
	}

	ctx.drawImage(await loadImage(artwork), 0, 0, width, height)
	await drawItems(ctx, edit, width, height)
}

function sheetSize(frame: Frame, longSide?: number) {
	const [w, h] = SIZES[frame.size].inches
	const dpi = longSide ? longSide / Math.max(w, h) : DPI
	return [w * dpi, h * dpi] as const
}

async function sheet(spec: OutputSpec, filtered: boolean) {
	const { el, ctx } = canvas(...sheetSize(spec.frame))
	await paintSheet(ctx, spec, spec.photos, filtered)
	return toBlob(el)
}

async function still(src: string, slot: SlotEdit) {
	const image = await loadImage(src)
	const { el, ctx } = canvas(image.naturalWidth, image.naturalHeight)
	await drawPhoto(ctx, src, { x: 0, y: 0, w: el.width, h: el.height }, slot, null)
	return toBlob(el, 'image/jpeg', JPEG_QUALITY)
}

async function encodeGif(
	ctx: CanvasRenderingContext2D,
	count: number,
	paint: (step: number) => Promise<void>,
	delay = LOOP_DELAY
) {
	const { GIFEncoder, quantize, applyPalette } = await import('gifenc')
	const { width, height } = ctx.canvas
	const encoder = GIFEncoder()

	for (let step = 0; step < count; step++) {
		await paint(step)
		const { data } = ctx.getImageData(0, 0, width, height)
		const palette = quantize(data, 256, { format: 'rgb565' })
		encoder.writeFrame(applyPalette(data, palette, 'rgb565'), width, height, { palette, delay })
		await new Promise((resolve) => setTimeout(resolve))
	}

	encoder.finish()
	return new Blob([encoder.bytesView() as BlobPart], { type: 'image/gif' })
}

const footage = (burst: string[] | undefined, still: string) => (burst?.length ? burst : [still])

async function sheetGif(spec: OutputSpec, filtered: boolean) {
	const reels = spec.photos.map((src, i) => footage(spec.bursts[i], src))
	const picks = sampleIndexes(Math.max(...reels.map((reel) => reel.length)), LOOP_FRAMES)
	const { ctx } = canvas(...sheetSize(spec.frame, SHEET_GIF_SIDE))

	return encodeGif(ctx, picks.length, (step) =>
		paintSheet(
			ctx,
			spec,
			reels.map((reel) => reel[Math.min(picks[step], reel.length - 1)]),
			filtered
		)
	)
}

async function slotGif(reel: string[], slot: SlotEdit | null) {
	const first = await loadImage(reel[0])
	const scale = Math.min(1, SLOT_GIF_SIDE / Math.max(first.naturalWidth, first.naturalHeight))
	const { el, ctx } = canvas(first.naturalWidth * scale, first.naturalHeight * scale)
	const picks = sampleIndexes(reel.length, LOOP_FRAMES)

	return encodeGif(ctx, picks.length, async (step) => {
		ctx.clearRect(0, 0, el.width, el.height)
		await drawPhoto(ctx, reel[picks[step]], { x: 0, y: 0, w: el.width, h: el.height }, slot, null)
	})
}

async function slideshow(photos: string[], slots: (SlotEdit | null)[]) {
	const first = await loadImage(photos[0])
	const scale = Math.min(1, SLIDESHOW_SIDE / Math.max(first.naturalWidth, first.naturalHeight))
	const { el, ctx } = canvas(first.naturalWidth * scale, first.naturalHeight * scale)

	return encodeGif(
		ctx,
		photos.length,
		async (step) => {
			ctx.clearRect(0, 0, el.width, el.height)
			await drawPhoto(ctx, photos[step], { x: 0, y: 0, w: el.width, h: el.height }, slots[step], null)
		},
		SLIDESHOW_DELAY
	)
}

export function outputCount({ photos, edit }: Pick<OutputSpec, 'photos' | 'edit'>) {
	const filtered = edit.slots.some(isFiltered)
	return (photos.length * 2 + 3) * (filtered ? 2 : 1)
}

export async function buildOutputs(spec: OutputSpec, onProgress?: (done: number, total: number) => void) {
	const { photos, bursts, edit } = spec
	const filtered = edit.slots.some(isFiltered)
	const total = outputCount(spec)
	const outputs: Output[] = []

	const add = (output: Output) => {
		outputs.push(output)
		onProgress?.(outputs.length, total)
	}

	await document.fonts?.ready

	try {
		if (filtered) add({ key: 'frame-filtered', kind: 'png', category: 'frame-filtered', blob: await sheet(spec, true) })
		add({ key: 'frame', kind: 'png', category: 'frame', blob: await sheet(spec, false) })

		if (filtered) {
			add({ key: 'frame-filtered-gif', kind: 'gif', category: 'frame-filtered', blob: await sheetGif(spec, true) })
		}
		add({ key: 'frame-gif', kind: 'gif', category: 'frame', blob: await sheetGif(spec, false) })

		if (filtered) {
			add({ key: 'filtered-slideshow', kind: 'gif', category: 'filtered', blob: await slideshow(photos, edit.slots) })
		}
		add({
			key: 'plain-slideshow',
			kind: 'gif',
			category: 'plain',
			blob: await slideshow(
				photos,
				photos.map(() => null)
			)
		})

		for (const [i, src] of photos.entries()) {
			const index = i + 1
			const reel = footage(bursts[i], src)

			add({ key: `plain-${index}`, kind: 'jpg', category: 'plain', index, blob: await (await fetch(src)).blob() })
			add({ key: `plain-${index}-gif`, kind: 'gif', category: 'plain', index, blob: await slotGif(reel, null) })

			if (!filtered) continue
			const slot = edit.slots[i]
			add({ key: `filtered-${index}`, kind: 'jpg', category: 'filtered', index, blob: await still(src, slot) })
			add({ key: `filtered-${index}-gif`, kind: 'gif', category: 'filtered', index, blob: await slotGif(reel, slot) })
		}
	} finally {
		images.clear()
	}

	return outputs
}

export function shareForm(outputs: Output[], frame: Frame, locale: string) {
	const form = new FormData()
	form.append('frame', frame.id)
	form.append('slots', String(frame.slots.length))
	form.append('locale', locale)
	form.append(
		'manifest',
		JSON.stringify(outputs.map(({ key, kind, category, index }) => ({ key, kind, category, index })))
	)
	for (const { key, kind, blob } of outputs) form.append(`${key}.${kind}`, blob, `${key}.${kind}`)
	return form
}
