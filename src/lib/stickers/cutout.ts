export type Crop = { x: number; y: number; width: number; height: number }

export type Handle = 'nw' | 'ne' | 'sw' | 'se'

export const HANDLES: readonly Handle[] = ['nw', 'ne', 'sw', 'se']

export const FULL_CROP: Crop = { x: 0, y: 0, width: 1, height: 1 }

export const STRENGTH = { min: 0, max: 100, initial: 40 } as const

const TRANSPARENT = 16
const PALETTE_SHARE = 0.03
const PALETTE_SIZE = 6

type Color = [red: number, green: number, blue: number]

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value))
}

export function moveCrop(crop: Crop, deltaX: number, deltaY: number): Crop {
	return {
		...crop,
		x: clamp(crop.x + deltaX, 0, 1 - crop.width),
		y: clamp(crop.y + deltaY, 0, 1 - crop.height)
	}
}

export function resizeCrop(crop: Crop, handle: Handle, deltaX: number, deltaY: number, minimum: number): Crop {
	let left = crop.x
	let top = crop.y
	let right = crop.x + crop.width
	let bottom = crop.y + crop.height

	if (handle === 'nw' || handle === 'sw') {
		left = clamp(left + deltaX, 0, right - minimum)
	} else {
		right = clamp(right + deltaX, left + minimum, 1)
	}

	if (handle === 'nw' || handle === 'ne') {
		top = clamp(top + deltaY, 0, bottom - minimum)
	} else {
		bottom = clamp(bottom + deltaY, top + minimum, 1)
	}

	return { x: left, y: top, width: right - left, height: bottom - top }
}

export function cropPixels(crop: Crop, width: number, height: number) {
	const left = Math.round(crop.x * width)
	const top = Math.round(crop.y * height)

	return {
		x: left,
		y: top,
		width: Math.max(1, Math.min(width - left, Math.round(crop.width * width))),
		height: Math.max(1, Math.min(height - top, Math.round(crop.height * height)))
	}
}

function borderIndexes(width: number, height: number) {
	const indexes = new Set<number>()

	for (const x of Array.from({ length: width }).keys()) {
		indexes.add(x)
		indexes.add((height - 1) * width + x)
	}

	for (const y of Array.from({ length: height }).keys()) {
		indexes.add(y * width)
		indexes.add(y * width + width - 1)
	}

	return [...indexes]
}

function borderPalette(pixels: Uint8ClampedArray, border: number[]) {
	const buckets = new Map<number, { count: number; sum: Color }>()
	let opaque = 0

	for (const index of border) {
		const offset = index * 4
		if (pixels[offset + 3] < TRANSPARENT) {
			continue
		}

		opaque++
		const key = ((pixels[offset] >> 3) << 10) | ((pixels[offset + 1] >> 3) << 5) | (pixels[offset + 2] >> 3)
		const bucket = buckets.get(key) ?? { count: 0, sum: [0, 0, 0] }
		bucket.count++
		bucket.sum[0] += pixels[offset]
		bucket.sum[1] += pixels[offset + 1]
		bucket.sum[2] += pixels[offset + 2]
		buckets.set(key, bucket)
	}

	return [...buckets.values()]
		.filter((bucket) => bucket.count >= opaque * PALETTE_SHARE)
		.sort((first, second) => second.count - first.count)
		.slice(0, PALETTE_SIZE)
		.map(({ count, sum }) => sum.map((channel) => channel / count) as Color)
}

function distanceTo(palette: Color[], pixels: Uint8ClampedArray, offset: number) {
	let nearest = Infinity
	for (const [red, green, blue] of palette) {
		const distance = Math.hypot(pixels[offset] - red, pixels[offset + 1] - green, pixels[offset + 2] - blue)
		nearest = Math.min(nearest, distance)
	}

	return nearest
}

export function strengthToThreshold(strength: number) {
	return 10 + (clamp(strength, STRENGTH.min, STRENGTH.max) / STRENGTH.max) * 110
}

export function removeBackground(pixels: Uint8ClampedArray, width: number, height: number, strength: number) {
	const output = new Uint8ClampedArray(pixels)
	const threshold = strengthToThreshold(strength)
	const feather = threshold / 2
	const border = borderIndexes(width, height)
	const palette = borderPalette(pixels, border)
	const cleared = new Uint8Array(width * height)
	const stack = new Int32Array(width * height)
	let top = 0

	function isBackground(index: number) {
		const offset = index * 4
		return pixels[offset + 3] < TRANSPARENT || distanceTo(palette, pixels, offset) <= threshold
	}

	for (const index of border) {
		if (!cleared[index] && isBackground(index)) {
			cleared[index] = 1
			stack[top++] = index
		}
	}

	while (top) {
		const index = stack[--top]
		const x = index % width
		const neighbours = [
			x > 0 ? index - 1 : -1,
			x < width - 1 ? index + 1 : -1,
			index >= width ? index - width : -1,
			index < width * (height - 1) ? index + width : -1
		]

		for (const neighbour of neighbours) {
			if (neighbour !== -1 && !cleared[neighbour] && isBackground(neighbour)) {
				cleared[neighbour] = 1
				stack[top++] = neighbour
			}
		}
	}

	for (const index of cleared.keys()) {
		const offset = index * 4
		if (cleared[index]) {
			output[offset + 3] = 0
			continue
		}

		const x = index % width
		const isEdge =
			(x > 0 && cleared[index - 1]) ||
			(x < width - 1 && cleared[index + 1]) ||
			(index >= width && cleared[index - width]) ||
			(index < width * (height - 1) && cleared[index + width])

		if (isEdge && palette.length) {
			const softness = clamp((distanceTo(palette, pixels, offset) - threshold) / feather, 0, 1)
			output[offset + 3] = Math.round(output[offset + 3] * softness)
		}
	}

	return output
}

export function opaqueBounds(pixels: Uint8ClampedArray, width: number, height: number) {
	let left = width
	let top = height
	let right = -1
	let bottom = -1

	for (const index of new Uint8Array(width * height).keys()) {
		if (pixels[index * 4 + 3] < TRANSPARENT) {
			continue
		}

		const x = index % width
		const y = (index - x) / width
		left = Math.min(left, x)
		right = Math.max(right, x)
		top = Math.min(top, y)
		bottom = Math.max(bottom, y)
	}

	return right === -1 ? null : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 }
}
