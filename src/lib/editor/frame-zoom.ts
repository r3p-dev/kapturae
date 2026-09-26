export const FRAME_ZOOM = {
	min: 1,
	max: 4,
	step: 0.25,
	toggle: 2
} as const

export type Point = { x: number; y: number }
export type Size = { width: number; height: number }
export type ZoomState = { scale: number; x: number; y: number }

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value))
}

export function clampPan(pan: Point, scale: number, size: Size): Point {
	const clampedScale = clamp(scale, FRAME_ZOOM.min, FRAME_ZOOM.max)
	if (clampedScale <= FRAME_ZOOM.min || size.width <= 0 || size.height <= 0) {
		return { x: 0, y: 0 }
	}

	const minX = size.width * (1 - clampedScale)
	const minY = size.height * (1 - clampedScale)

	return {
		x: clamp(pan.x, minX, 0) || 0,
		y: clamp(pan.y, minY, 0) || 0
	}
}

export function zoomAt(state: ZoomState, nextScale: number, origin: Point, size: Size): ZoomState {
	const scale = clamp(nextScale, FRAME_ZOOM.min, FRAME_ZOOM.max)
	if (scale <= FRAME_ZOOM.min || size.width <= 0 || size.height <= 0) {
		return { scale: FRAME_ZOOM.min, x: 0, y: 0 }
	}

	const currentScale = state.scale > 0 ? state.scale : FRAME_ZOOM.min
	const ratio = scale / currentScale
	const rawPan = {
		x: origin.x - (origin.x - state.x) * ratio,
		y: origin.y - (origin.y - state.y) * ratio
	}
	const pan = clampPan(rawPan, scale, size)

	return { scale, x: pan.x, y: pan.y }
}
