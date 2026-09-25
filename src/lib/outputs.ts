import { blobEntry } from '$lib/blobs'
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
const STICKER_SIZE = 512

const FONTS = {
	bold(size: number) {
		return `800 ${size}px "Archivo Variable"`
	},
	mono(size: number) {
		return `400 ${size}px "IBM Plex Mono"`
	},
	serif(size: number) {
		return `italic 400 ${size}px ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`
	}
}

type Box = { x: number; y: number; width: number; height: number }

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
	const element = document.createElement('canvas')
	element.width = Math.round(width)
	element.height = Math.round(height)

	const context = element.getContext('2d', { willReadFrequently: true })
	if (!context) {
		throw new Error('2D canvas unavailable')
	}
	context.imageSmoothingQuality = 'high'

	return { element, context }
}

function toBlob(element: HTMLCanvasElement, type = 'image/png', quality?: number) {
	return new Promise<Blob>((resolve, reject) =>
		element.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed'))), type, quality)
	)
}

function overlay(
	context: CanvasRenderingContext2D,
	box: Box,
	mode: GlobalCompositeOperation,
	alpha: number,
	fill: string | CanvasPattern
) {
	context.save()
	context.globalCompositeOperation = mode
	context.globalAlpha = alpha
	context.fillStyle = fill
	context.fillRect(box.x, box.y, box.width, box.height)
	context.restore()
}

async function drawPhoto(
	context: CanvasRenderingContext2D,
	src: string,
	box: Box,
	slot: SlotEdit | null,
	pan: SlotEdit | null
) {
	const image = await loadImage(src)
	const { zoom, x, y } = pan ?? { zoom: 100, x: 0, y: 0 }
	const cover = Math.max(box.width / image.naturalWidth, box.height / image.naturalHeight) * (zoom / 100)
	const drawWidth = image.naturalWidth * cover
	const drawHeight = image.naturalHeight * cover

	context.save()
	context.beginPath()
	context.rect(box.x, box.y, box.width, box.height)
	context.clip()
	context.filter = slot ? filterCss(slot.filter, slot.intensity, slot) : 'none'
	context.drawImage(
		image,
		box.x + ((box.width - drawWidth) * (1 - x)) / 2,
		box.y + ((box.height - drawHeight) * (1 - y)) / 2,
		drawWidth,
		drawHeight
	)
	context.restore()

	if (!slot) {
		return
	}

	const tint = filterTint(slot.filter, slot.intensity)
	if (tint) {
		overlay(context, box, 'soft-light', tint.opacity, tint.color)
	}

	if (slot.warmth) {
		overlay(context, box, 'soft-light', Math.abs(slot.warmth) / 200, slot.warmth > 0 ? '#ff8a1f' : '#2f7bff')
	}

	if (slot.grain) {
		const grain = await loadImage(GRAIN)
		const pattern = context.createPattern(grain, 'repeat')

		if (pattern) {
			pattern.setTransform(new DOMMatrix().scale(context.canvas.width / GRAIN_TILE))
			overlay(context, box, 'overlay', (slot.grain / 100) * 0.6, pattern)
		}
	}
}

async function drawItems(context: CanvasRenderingContext2D, edit: Edit, width: number, height: number) {
	const unit = width / 100

	context.save()
	context.lineCap = 'round'
	context.lineJoin = 'round'

	for (const stroke of edit.strokes) {
		context.strokeStyle = stroke.color
		context.lineWidth = stroke.width * unit
		context.beginPath()

		for (const [index, coordinate] of stroke.points.entries()) {
			if (index % 2 === 0) {
				context.lineTo(coordinate * unit, stroke.points[index + 1] * unit)
			}
		}

		context.stroke()
	}

	context.restore()

	for (const item of edit.items) {
		const x = (item.x / 100) * width
		const y = (item.y / 100) * height

		if (item.kind === 'sticker') {
			const src = isStickerId(item.sticker) ? stickerSrc(item.sticker, STICKER_SIZE) : item.sticker
			const image = await loadImage(src)
			const drawWidth = item.size * unit
			const drawHeight = (drawWidth * image.naturalHeight) / image.naturalWidth
			context.drawImage(image, x - drawWidth / 2, y - drawHeight / 2, drawWidth, drawHeight)
			continue
		}

		const fontSize = item.size * unit
		const font = FONTS[item.font](fontSize)
		await document.fonts?.load(font, item.text)

		context.save()
		context.font = font
		context.fillStyle = item.color
		context.textAlign = 'center'
		context.textBaseline = 'middle'

		if (item.font === 'bold') {
			context.fontStretch = 'semi-expanded'
			context.letterSpacing = `${fontSize * 0.08}px`
		}

		context.fillText(item.text, x, y)
		context.restore()
	}
}

async function paintSheet(
	context: CanvasRenderingContext2D,
	{ frame, artwork, edit }: OutputSpec,
	sources: (string | undefined)[],
	shouldFilter: boolean
) {
	const { width, height } = context.canvas
	function box(frameSlot: FrameSlot): Box {
		return {
			x: (frameSlot.x / 100) * width,
			y: (frameSlot.y / 100) * height,
			width: (frameSlot.width / 100) * width,
			height: (frameSlot.height / 100) * height
		}
	}

	context.clearRect(0, 0, width, height)
	for (const [index, src] of sources.entries()) {
		const slot = edit.slots[index]

		if (src) {
			await drawPhoto(context, src, box(frame.slots[index]), shouldFilter ? slot : null, slot)
		}
	}

	const artworkImage = await loadImage(artwork)
	context.drawImage(artworkImage, 0, 0, width, height)
	await drawItems(context, edit, width, height)
}

function sheetSize(frame: Frame, longSide?: number) {
	const [widthInches, heightInches] = SIZES[frame.size].inches
	const dpi = longSide ? longSide / Math.max(widthInches, heightInches) : DPI
	return [widthInches * dpi, heightInches * dpi] as const
}

async function sheet(spec: OutputSpec, shouldFilter: boolean) {
	const { element, context } = canvas(...sheetSize(spec.frame))
	await paintSheet(context, spec, spec.photos, shouldFilter)
	return toBlob(element)
}

async function still(src: string, slot: SlotEdit | null) {
	const image = await loadImage(src)
	const { element, context } = canvas(image.naturalWidth, image.naturalHeight)
	await drawPhoto(context, src, { x: 0, y: 0, width: element.width, height: element.height }, slot, null)
	return toBlob(element, 'image/jpeg', JPEG_QUALITY)
}

async function encodeGif(
	context: CanvasRenderingContext2D,
	count: number,
	paint: (step: number) => Promise<void>,
	delay = LOOP_DELAY
) {
	const { GIFEncoder, quantize, applyPalette } = await import('gifenc')
	const { width, height } = context.canvas
	const encoder = GIFEncoder()

	for (const step of Array.from({ length: count }).keys()) {
		await paint(step)
		const { data } = context.getImageData(0, 0, width, height)
		const palette = quantize(data, 256, { format: 'rgb565' })
		encoder.writeFrame(applyPalette(data, palette, 'rgb565'), width, height, { palette, delay })
		await new Promise((resolve) => setTimeout(resolve))
	}

	encoder.finish()
	return new Blob([encoder.bytesView() as BlobPart], { type: 'image/gif' })
}

function footage(burst: string[] | undefined, fallback: string) {
	return burst?.length ? burst : [fallback]
}

async function sheetGif(spec: OutputSpec, shouldFilter: boolean) {
	const reels = spec.photos.map((src, index) => footage(spec.bursts[index], src))
	const picks = sampleIndexes(Math.max(...reels.map((reel) => reel.length)), LOOP_FRAMES)
	const { context } = canvas(...sheetSize(spec.frame, SHEET_GIF_SIDE))

	return encodeGif(context, picks.length, (step) =>
		paintSheet(
			context,
			spec,
			reels.map((reel) => reel[Math.min(picks[step], reel.length - 1)]),
			shouldFilter
		)
	)
}

async function slotGif(reel: string[], slot: SlotEdit | null) {
	const first = await loadImage(reel[0])
	const scale = Math.min(1, SLOT_GIF_SIDE / Math.max(first.naturalWidth, first.naturalHeight))
	const { element, context } = canvas(first.naturalWidth * scale, first.naturalHeight * scale)
	const picks = sampleIndexes(reel.length, LOOP_FRAMES)

	return encodeGif(context, picks.length, async (step) => {
		context.clearRect(0, 0, element.width, element.height)
		await drawPhoto(
			context,
			reel[picks[step]],
			{ x: 0, y: 0, width: element.width, height: element.height },
			slot,
			null
		)
	})
}

async function slideshow(photos: string[], slots: (SlotEdit | null)[]) {
	const first = await loadImage(photos[0])
	const scale = Math.min(1, SLIDESHOW_SIDE / Math.max(first.naturalWidth, first.naturalHeight))
	const { element, context } = canvas(first.naturalWidth * scale, first.naturalHeight * scale)

	return encodeGif(
		context,
		photos.length,
		async (step) => {
			context.clearRect(0, 0, element.width, element.height)
			await drawPhoto(
				context,
				photos[step],
				{ x: 0, y: 0, width: element.width, height: element.height },
				slots[step],
				null
			)
		},
		SLIDESHOW_DELAY
	)
}

export function outputCount({ photos, edit }: Pick<OutputSpec, 'photos' | 'edit'>) {
	const hasFilters = edit.slots.some(isFiltered)
	return (photos.length * 2 + 3) * (hasFilters ? 2 : 1)
}

export async function buildOutputs(
	spec: OutputSpec,
	onProgress?: (done: number, total: number, output: Output) => void
) {
	const { photos, bursts, edit } = spec
	const hasFilters = edit.slots.some(isFiltered)
	const total = outputCount(spec)
	const outputs: Output[] = []

	function add(output: Output) {
		outputs.push(output)
		onProgress?.(outputs.length, total, output)
	}

	await document.fonts?.ready

	try {
		if (hasFilters) {
			add({ key: 'frame-filtered', kind: 'png', category: 'frame-filtered', blob: await sheet(spec, true) })
		}
		add({ key: 'frame', kind: 'png', category: 'frame', blob: await sheet(spec, false) })

		if (hasFilters) {
			add({ key: 'frame-filtered-gif', kind: 'gif', category: 'frame-filtered', blob: await sheetGif(spec, true) })
		}
		add({ key: 'frame-gif', kind: 'gif', category: 'frame', blob: await sheetGif(spec, false) })

		if (hasFilters) {
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

		for (const [position, src] of photos.entries()) {
			const index = position + 1
			const reel = footage(bursts[position], src)
			const original = blobEntry(src)?.blob ?? (await still(src, null))

			add({ key: `plain-${index}`, kind: 'jpg', category: 'plain', index, blob: original })
			add({ key: `plain-${index}-gif`, kind: 'gif', category: 'plain', index, blob: await slotGif(reel, null) })

			if (!hasFilters) {
				continue
			}

			const slot = edit.slots[position]
			add({ key: `filtered-${index}`, kind: 'jpg', category: 'filtered', index, blob: await still(src, slot) })
			add({ key: `filtered-${index}-gif`, kind: 'gif', category: 'filtered', index, blob: await slotGif(reel, slot) })
		}
	} finally {
		images.clear()
	}

	return outputs
}
