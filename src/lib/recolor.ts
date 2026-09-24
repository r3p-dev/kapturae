import { inkOn, type Frame } from '$lib/session'

const TOLERANCE = 90
const CACHE_MAX = 24

const cache = new Map<string, Promise<string>>()

function rgb(hex: string) {
	return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
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
	if (ink !== frame.ink) swaps.push([rgb(frame.ink), rgb(ink)])

	const job = paint(frame.src, swaps)
	cache.set(key, job)
	job.catch(() => cache.delete(key))

	for (const [old, stale] of cache) {
		if (cache.size <= CACHE_MAX) break
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

	const ctx = canvas.getContext('2d', { willReadFrequently: true })
	if (!ctx) throw new Error('2D canvas unavailable')

	ctx.drawImage(image, 0, 0)
	const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
	const { data } = pixels

	for (let i = 0; i < data.length; i += 4) {
		if (!data[i + 3]) continue

		for (const [from, to] of swaps) {
			const d = Math.hypot(data[i] - from[0], data[i + 1] - from[1], data[i + 2] - from[2])
			if (d >= TOLERANCE) continue

			const weight = Math.min(1, (1 - d / TOLERANCE) * 2)
			for (let c = 0; c < 3; c++) data[i + c] += weight * (to[c] - from[c])
			break
		}
	}

	ctx.putImageData(pixels, 0, 0)

	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
	if (!blob) throw new Error('Recolor failed')

	return URL.createObjectURL(blob)
}
