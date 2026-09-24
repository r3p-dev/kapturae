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

export const shots = $state<{
	size: PrintSize | null
	frame: FrameId | null
	photos: string[]
	bursts: string[][]
	uploads: string[]
	edit: Edit | null
	published: { key: string; share: Share } | null
}>({
	size: null,
	frame: null,
	photos: [],
	bursts: [],
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

export function clearShots() {
	const { published } = shots
	const urls = [...shots.photos, ...shots.uploads, ...(published ? [published.share.sheet, published.share.gif] : [])]
	urls.filter((url) => url.startsWith('blob:')).forEach((url) => URL.revokeObjectURL(url))
	shots.photos = []
	shots.bursts = []
	shots.uploads = []
	shots.edit = null
	shots.published = null
}
