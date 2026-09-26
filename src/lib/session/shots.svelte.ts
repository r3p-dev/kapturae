import { revoke } from '$lib/storage/blobs'
import type { Edit } from '$lib/editor/editor.svelte'
import type { FrameId } from '$lib/frames/frames'
import type { PrintSize } from '$lib/session/session'

export type PhotoSource = 'camera' | 'upload'

export type Photo = {
	url: string
	source: PhotoSource
	name?: string
	burst: string[]
}

export type Shots = {
	size: PrintSize | null
	frame: FrameId | null
	photos: string[]
	library: Photo[]
	uploads: string[]
	edit: Edit | null
}

export const shots = $state<Shots>({
	size: null,
	frame: null,
	photos: [],
	library: [],
	uploads: [],
	edit: null
})

export function useShots(size: PrintSize, frame: FrameId) {
	if (shots.size === size && shots.frame === frame) {
		return
	}

	clearShots()
	shots.size = size
	shots.frame = frame
}

export function addPhoto(photo: Photo) {
	shots.library.push(photo)
	return photo.url
}

export function photoFor(url: string | undefined) {
	return url ? shots.library.find((photo) => photo.url === url) : undefined
}

export function slotOfShot(shot: number) {
	return shots.edit?.order.indexOf(shot) ?? shot
}

export function firstEmptyShot(total: number) {
	return Array.from({ length: total }, (_, shot) => shot)
		.sort((first, second) => slotOfShot(first) - slotOfShot(second))
		.find((shot) => !shots.photos[shot])
}

export function clearShots() {
	for (const url of [...shots.library.map((photo) => photo.url), ...shots.uploads]) {
		revoke(url)
	}

	shots.photos = []
	shots.library = []
	shots.uploads = []
	shots.edit = null
}

export function endSession() {
	clearShots()
	shots.size = null
	shots.frame = null
}

export function watchShots(onchange: (state: Shots) => void) {
	return $effect.root(() => {
		$effect(() => {
			onchange($state.snapshot(shots) as Shots)
		})
	})
}
