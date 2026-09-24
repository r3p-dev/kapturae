import type { Edit } from '$lib/editor.svelte'
import type { FrameId } from '$lib/frames'
import type { PrintSize } from '$lib/session'

export const shots = $state<{
	size: PrintSize | null
	frame: FrameId | null
	photos: string[]
	uploads: string[]
	edit: Edit | null
}>({
	size: null,
	frame: null,
	photos: [],
	uploads: [],
	edit: null
})

export function useShots(size: PrintSize, frame: FrameId) {
	if (shots.size === size && shots.frame === frame) return
	clearShots()
	shots.size = size
	shots.frame = frame
}

export function clearShots() {
	shots.photos.forEach((url) => URL.revokeObjectURL(url))
	shots.uploads.forEach((url) => URL.revokeObjectURL(url))
	shots.photos = []
	shots.uploads = []
	shots.edit = null
}
