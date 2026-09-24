const SVG = {
	star: '<path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.3L12 17.8 5.7 21.5l1.7-7.3L2 9.5l7.1-.6z" fill="#E8B23A" stroke="#0E0E0D" stroke-width="1"/>',
	heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill="#C8281A"/>',
	sparkle:
		'<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4" stroke="#F4F2EE" stroke-width="2"/>',
	twinkle: '<path d="M12 1c1 6 5 10 11 11-6 1-10 5-11 11-1-6-5-10-11-11 6-1 10-5 11-11z" fill="#F4F2EE"/>',
	smile:
		'<circle cx="12" cy="12" r="9" fill="#1F5FBF"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#F4F2EE" stroke-width="1.8" fill="none"/>',
	sun: '<circle cx="12" cy="12" r="5" fill="#E8B23A"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="#E8B23A" stroke-width="2" stroke-linecap="round"/>',
	moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" fill="#F4F2EE"/>',
	cloud: '<path d="M7 19a5 5 0 0 1-.6-9.96A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 10z" fill="#F4F2EE"/>',
	rainbow:
		'<path d="M2 18a10 10 0 0 1 20 0" stroke="#C8281A" stroke-width="2.5" fill="none"/><path d="M5 18a7 7 0 0 1 14 0" stroke="#E8B23A" stroke-width="2.5" fill="none"/><path d="M8 18a4 4 0 0 1 8 0" stroke="#1F5FBF" stroke-width="2.5" fill="none"/>',
	bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="#E8B23A" stroke="#0E0E0D" stroke-width="1" stroke-linejoin="round"/>',
	fire: '<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 2-5 0 2 1 3 2 3 0-4 2-6 2-10z" fill="#E8612A"/><path d="M12 13c1 2 3 3 3 5a3 3 0 0 1-6 0c0-2 2-3 3-5z" fill="#E8B23A"/>',
	snowflake:
		'<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M12 5l-2-2M12 5l2-2M12 19l-2 2M12 19l2 2" stroke="#BFE3F2" stroke-width="1.8" stroke-linecap="round"/>',
	flower:
		'<g fill="#E7B7C8"><circle cx="12" cy="7" r="3.6"/><circle cx="16.8" cy="10.5" r="3.6"/><circle cx="14.9" cy="16" r="3.6"/><circle cx="9.1" cy="16" r="3.6"/><circle cx="7.2" cy="10.5" r="3.6"/></g><circle cx="12" cy="12" r="2.6" fill="#E8B23A"/>',
	tree: '<path d="M4 20L12 3l8 17z" fill="#2E6B4B"/>',
	cherry:
		'<path d="M8 15c1-6 4-10 9-12M16 15c0-5 0-9 1-12" stroke="#2E6B4B" stroke-width="1.6" fill="none"/><circle cx="7.5" cy="17" r="4" fill="#C8281A"/><circle cx="16.5" cy="17" r="4" fill="#C8281A"/>',
	balloon:
		'<ellipse cx="12" cy="9" rx="6" ry="7.5" fill="#C8281A"/><path d="M12 16.5l-1.2 1.5h2.4z" fill="#C8281A"/><path d="M12 18c-1 2 1 3 0 5" stroke="#F4F2EE" stroke-width="1" fill="none"/>',
	gift: '<rect x="4" y="7" width="16" height="12" fill="#C8281A"/><rect x="11" y="7" width="2" height="12" fill="#E8B23A"/><path d="M12 7c-2-4-6-3-4 0M12 7c2-4 6-3 4 0" stroke="#E8B23A" stroke-width="1.6" fill="none"/>',
	bow: '<path d="M12 12L3 6v12zM12 12l9-6v12z" fill="#E7B7C8" stroke="#0E0E0D" stroke-width="1" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.4" fill="#C8281A"/>',
	crown:
		'<path d="M3 18L2 7l5.5 4L12 4l4.5 7L22 7l-1 11z" fill="#E8B23A" stroke="#0E0E0D" stroke-width="1" stroke-linejoin="round"/>',
	gem: '<path d="M6 3h12l4 6-10 12L2 9z" fill="#5FB7D9" stroke="#0E0E0D" stroke-width="1" stroke-linejoin="round"/><path d="M2 9h20M9 3l3 18 3-18" stroke="#0E0E0D" stroke-width=".8" fill="none"/>',
	note: '<path d="M9 18V5l11-2v13" stroke="#F4F2EE" stroke-width="2" fill="none"/><circle cx="6.5" cy="18" r="3" fill="#F4F2EE"/><circle cx="17.5" cy="16" r="3" fill="#F4F2EE"/>',
	bubble:
		'<path d="M3 5h18v11H10l-5 4v-4H3z" fill="#F4F2EE" stroke="#0E0E0D" stroke-width="1" stroke-linejoin="round"/><circle cx="8" cy="10.5" r="1.2" fill="#0E0E0D"/><circle cx="12" cy="10.5" r="1.2" fill="#0E0E0D"/><circle cx="16" cy="10.5" r="1.2" fill="#0E0E0D"/>',
	snowman:
		'<circle cx="12" cy="13" r="8" fill="#F4F2EE"/><circle cx="9" cy="12" r="1" fill="#0E0E0D"/><circle cx="15" cy="12" r="1" fill="#0E0E0D"/><path d="M12 14l3 1-3 1z" fill="#E8B23A"/>',
	cross: '<path d="M3 12h18M12 3v18" stroke="#E8B23A" stroke-width="3"/>'
}

export type StickerId = keyof typeof SVG

export const STICKER_IDS = Object.keys(SVG) as StickerId[]

export function isStickerId(sticker: string): sticker is StickerId {
	return sticker in SVG
}

export function stickerSrc(sticker: string) {
	return isStickerId(sticker)
		? `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${SVG[sticker]}</svg>`)}`
		: sticker
}

const UPLOAD_MAX = 600

export async function importSticker(file: File) {
	const bitmap = await createImageBitmap(file)
	const scale = Math.min(1, UPLOAD_MAX / Math.max(bitmap.width, bitmap.height))

	const canvas = document.createElement('canvas')
	canvas.width = Math.round(bitmap.width * scale)
	canvas.height = Math.round(bitmap.height * scale)

	const ctx = canvas.getContext('2d')
	if (!ctx) throw new Error('2D canvas unavailable')

	ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
	bitmap.close()

	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
	if (!blob) throw new Error('Sticker import failed')

	return URL.createObjectURL(blob)
}
