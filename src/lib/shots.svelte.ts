import type { Edit } from '$lib/editor.svelte'
import type { FrameId } from '$lib/frames'
import type { PrintSize } from '$lib/session'

export type Share = {
	id: string
	url: string
	qr: string
	expiresAt: number
	sheet: string
	gif: string
}

export type PhotoSource = 'camera' | 'upload'

export type Photo = {
	url: string
	source: PhotoSource
	name?: string
	burst: string[]
}

export const shots = $state<{
	size: PrintSize | null
	frame: FrameId | null
	photos: string[]
	library: Photo[]
	uploads: string[]
	edit: Edit | null
	published: { key: string; share: Share } | null
}>({
	size: null,
	frame: null,
	photos: [],
	library: [],
	uploads: [],
	edit: null,
	published: null
})

export function useShots(size: PrintSize, frame: FrameId) {
	if (shots.size === size && shots.frame === frame) return
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
		.sort((a, b) => slotOfShot(a) - slotOfShot(b))
		.find((shot) => !shots.photos[shot])
}

export function clearShots() {
	const { published } = shots
	const urls = [
		...shots.library.map((photo) => photo.url),
		...shots.uploads,
		...(published ? [published.share.sheet, published.share.gif] : [])
	]
	urls.filter((url) => url.startsWith('blob:')).forEach((url) => URL.revokeObjectURL(url))
	shots.photos = []
	shots.library = []
	shots.uploads = []
	shots.edit = null
	shots.published = null
}
