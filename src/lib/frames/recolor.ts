import { inkOn, type Frame } from '$lib/session/session'

const TOLERANCE = 90
const CACHE_MAX = 24

const cache = new Map<string, Promise<string>>()

function rgb(hex: string) {
	return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16))
}

export function inkFor(hex: string) {
	return inkOn(rgb(hex))
}

export function recolor(frame: Frame, color: string) {
	const key = `${frame.id}|${color}`
	const hit = cache.get(key)
	if (hit) {
		cache.delete(key)
		cache.set(key, hit)
		return hit
	}

	const swaps = [[rgb(frame.color), rgb(color)]]
	const ink = inkFor(color)
	if (ink !== frame.ink) {
		swaps.push([rgb(frame.ink), rgb(ink)])
	}

	const job = paint(frame.src, swaps)
	cache.set(key, job)
	job.catch(() => cache.delete(key))

	for (const [old, stale] of cache) {
		if (cache.size <= CACHE_MAX) {
			break
		}

		cache.delete(old)
		stale.then((url) => URL.revokeObjectURL(url)).catch(() => {})
	}

	return job
}

async function paint(src: string, swaps: number[][][]) {
	const image = new Image()
	image.src = src
	await image.decode()

	const canvas = document.createElement('canvas')
	canvas.width = image.naturalWidth
	canvas.height = image.naturalHeight

	const context = canvas.getContext('2d', { willReadFrequently: true })
	if (!context) {
		throw new Error('2D canvas unavailable')
	}

	context.drawImage(image, 0, 0)
	const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
	const { data } = pixels

	for (const pixel of new Uint32Array(data.buffer).keys()) {
		const offset = pixel * 4
		if (!data[offset + 3]) {
			continue
		}

		for (const [from, to] of swaps) {
			const distance = Math.hypot(data[offset] - from[0], data[offset + 1] - from[1], data[offset + 2] - from[2])
			if (distance >= TOLERANCE) {
				continue
			}

			const weight = Math.min(1, (1 - distance / TOLERANCE) * 2)
			for (const channel of [0, 1, 2]) {
				data[offset + channel] += weight * (to[channel] - from[channel])
			}
			break
		}
	}

	context.putImageData(pixels, 0, 0)

	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
	if (!blob) {
		throw new Error('Recolor failed')
	}

	return URL.createObjectURL(blob)
}
