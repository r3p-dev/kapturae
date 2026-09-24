import type { FrameId } from '$lib/frames'
import type { PrintSize } from '$lib/session'

export const shots = $state<{
	size: PrintSize | null
	frame: FrameId | null
	photos: string[]
}>({
	size: null,
	frame: null,
	photos: []
})

export function useShots(size: PrintSize, frame: FrameId) {
	if (shots.size === size && shots.frame === frame) return
	clearShots()
	shots.size = size
	shots.frame = frame
}

export function clearShots() {
	shots.photos.forEach((url) => URL.revokeObjectURL(url))
	shots.photos = []
}
