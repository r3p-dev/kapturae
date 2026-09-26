import { describe, expect, test } from 'bun:test'
import { FRAME_ZOOM, clampPan, zoomAt } from '$lib/editor/frame-zoom'

const SIZE = { width: 200, height: 400 }

describe('clampPan', () => {
	test('returns zero offset at 1x scale', () => {
		expect(clampPan({ x: -50, y: 30 }, 1, SIZE)).toEqual({ x: 0, y: 0 })
	})

	test('keeps content from panning out of view', () => {
		expect(clampPan({ x: 25, y: 40 }, 2, SIZE)).toEqual({ x: 0, y: 0 })
		expect(clampPan({ x: -500, y: -900 }, 2, SIZE)).toEqual({ x: -200, y: -400 })
		expect(clampPan({ x: -80, y: -150 }, 2, SIZE)).toEqual({ x: -80, y: -150 })
	})

	test('clamps pan to 4x maximum scale bounds', () => {
		expect(clampPan({ x: -1000, y: -2000 }, 10, SIZE)).toEqual({
			x: SIZE.width * (1 - FRAME_ZOOM.max),
			y: SIZE.height * (1 - FRAME_ZOOM.max)
		})
	})
})

describe('zoomAt', () => {
	test('anchors zoom around the cursor origin', () => {
		const initial = { scale: 1, x: 0, y: 0 }
		const center = { x: 100, y: 200 }
		const zoomed = zoomAt(initial, 2, center, SIZE)

		expect(zoomed).toEqual({ scale: 2, x: -100, y: -200 })

		const further = zoomAt(zoomed, 4, center, SIZE)
		expect(further).toEqual({ scale: 4, x: -300, y: -600 })
	})

	test('clamps scale between min (1x) and max (4x)', () => {
		const initial = { scale: 2, x: -100, y: -200 }

		expect(zoomAt(initial, 0.5, { x: 100, y: 200 }, SIZE)).toEqual({ scale: 1, x: 0, y: 0 })
		expect(zoomAt(initial, 8, { x: 0, y: 0 }, SIZE)).toEqual({ scale: 4, x: -200, y: -400 })
	})

	test('clamps pan when zooming near an edge', () => {
		const zoomed = zoomAt({ scale: 1, x: 0, y: 0 }, 2, { x: 200, y: 400 }, SIZE)
		expect(zoomed).toEqual({ scale: 2, x: -200, y: -400 })
	})
})
