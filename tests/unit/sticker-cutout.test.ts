import { describe, expect, test } from 'bun:test'
import {
	FULL_CROP,
	cropPixels,
	moveCrop,
	opaqueBounds,
	removeBackground,
	resizeCrop,
	strengthToThreshold
} from '$lib/sticker-cutout'

type Rgb = [number, number, number]

function image(width: number, height: number, paint: (x: number, y: number) => Rgb) {
	const pixels = new Uint8ClampedArray(width * height * 4)
	for (const index of new Uint8Array(width * height).keys()) {
		const x = index % width
		const y = (index - x) / width
		pixels.set([...paint(x, y), 255], index * 4)
	}
	return pixels
}

function alphaAt(pixels: Uint8ClampedArray, width: number, x: number, y: number) {
	return pixels[(y * width + x) * 4 + 3]
}

function isRing(x: number, y: number) {
	return x >= 8 && x < 32 && y >= 8 && y < 32 && !(x >= 14 && x < 26 && y >= 14 && y < 26)
}

const WHITE: Rgb = [250, 250, 248]
const RED: Rgb = [200, 30, 20]

describe('removeBackground', () => {
	test('clears a plain background and keeps the subject', () => {
		const pixels = image(40, 40, (x, y) => (x >= 10 && x < 30 && y >= 10 && y < 30 ? RED : WHITE))
		const result = removeBackground(pixels, 40, 40, 40)

		expect(alphaAt(result, 40, 0, 0)).toBe(0)
		expect(alphaAt(result, 40, 5, 20)).toBe(0)
		expect(alphaAt(result, 40, 20, 20)).toBe(255)
		expect(alphaAt(result, 40, 10, 10)).toBeGreaterThan(200)
	})

	test('keeps background-coloured pixels enclosed by the subject', () => {
		const pixels = image(40, 40, (x, y) => (isRing(x, y) ? RED : WHITE))
		const result = removeBackground(pixels, 40, 40, 60)

		expect(alphaAt(result, 40, 2, 2)).toBe(0)
		expect(alphaAt(result, 40, 20, 20)).toBe(255)
	})

	test('treats slightly noisy backgrounds as one colour', () => {
		const pixels = image(30, 30, (x, y) =>
			x >= 10 && x < 20 && y >= 10 && y < 20 ? RED : [240 + ((x * 7 + y * 3) % 12), 240, 240]
		)
		const result = removeBackground(pixels, 30, 30, 40)

		expect(alphaAt(result, 30, 3, 25)).toBe(0)
		expect(alphaAt(result, 30, 15, 15)).toBe(255)
	})

	test('never removes the subject at the lowest strength', () => {
		const pixels = image(20, 20, (x, y) => (x >= 5 && x < 15 && y >= 5 && y < 15 ? RED : WHITE))
		const result = removeBackground(pixels, 20, 20, 0)

		expect(alphaAt(result, 20, 0, 0)).toBe(0)
		expect(alphaAt(result, 20, 10, 10)).toBe(255)
	})

	test('does not modify its input', () => {
		const pixels = image(10, 10, () => WHITE)
		removeBackground(pixels, 10, 10, 50)

		expect(alphaAt(pixels, 10, 0, 0)).toBe(255)
	})

	test('grows the threshold with strength', () => {
		expect(strengthToThreshold(100)).toBeGreaterThan(strengthToThreshold(0))
		expect(strengthToThreshold(500)).toBe(strengthToThreshold(100))
	})
})

describe('opaqueBounds', () => {
	test('returns the box around visible pixels', () => {
		const pixels = new Uint8ClampedArray(10 * 10 * 4)
		pixels[(3 * 10 + 2) * 4 + 3] = 255
		pixels[(6 * 10 + 7) * 4 + 3] = 255

		expect(opaqueBounds(pixels, 10, 10)).toEqual({ x: 2, y: 3, width: 6, height: 4 })
	})

	test('returns null for a fully transparent image', () => {
		expect(opaqueBounds(new Uint8ClampedArray(4 * 4 * 4), 4, 4)).toBeNull()
	})
})

describe('crop', () => {
	test('moving stays inside the image', () => {
		const crop = { x: 0.5, y: 0.5, width: 0.4, height: 0.4 }

		expect(moveCrop(crop, 0.5, -1)).toEqual({ x: 0.6, y: 0, width: 0.4, height: 0.4 })
	})

	test('resizing from a corner keeps the opposite corner fixed', () => {
		const crop = resizeCrop(FULL_CROP, 'nw', 0.25, 0.1, 0.05)

		expect(crop.x).toBeCloseTo(0.25)
		expect(crop.y).toBeCloseTo(0.1)
		expect(crop.x + crop.width).toBeCloseTo(1)
		expect(crop.y + crop.height).toBeCloseTo(1)
	})

	test('resizing never goes below the minimum size', () => {
		const crop = resizeCrop({ x: 0.2, y: 0.2, width: 0.3, height: 0.3 }, 'se', -1, -1, 0.1)

		expect(crop.width).toBeCloseTo(0.1)
		expect(crop.height).toBeCloseTo(0.1)
	})

	test('converts to whole pixels within the image', () => {
		expect(cropPixels({ x: 0.25, y: 0.5, width: 0.5, height: 0.5 }, 400, 300)).toEqual({
			x: 100,
			y: 150,
			width: 200,
			height: 150
		})
		expect(cropPixels(FULL_CROP, 3, 3)).toEqual({ x: 0, y: 0, width: 3, height: 3 })
	})
})
