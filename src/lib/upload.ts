export const UPLOAD_ACCEPT = 'image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif'
export const UPLOAD_MAX_MB = 20
export const UPLOAD_MIN_SIDE = 600
export const UPLOAD_MAX_MP = 50

const MAX_BYTES = UPLOAD_MAX_MB * 1024 * 1024
const LONG_SIDE = 2560
const JPEG_QUALITY = 0.92
const TYPES = /^image\/(jpeg|png|heic|heif)$/
const EXTENSIONS = /\.(jpe?g|png|hei[cf])$/i
const HEIC = /(^image\/hei[cf]$)|(\.hei[cf]$)/i

export type UploadProblem = 'format' | 'size' | 'small' | 'large' | 'heic' | 'unreadable'

export class UploadRejected extends Error {
	constructor(readonly problem: UploadProblem) {
		super(problem)
	}
}

export function isImageFile(file: File) {
	return TYPES.test(file.type) || EXTENSIONS.test(file.name)
}

export async function importPhoto(file: File) {
	if (!isImageFile(file)) throw new UploadRejected('format')
	if (file.size > MAX_BYTES) throw new UploadRejected('size')

	let bitmap: ImageBitmap
	try {
		bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
	} catch {
		throw new UploadRejected(HEIC.test(file.type) || HEIC.test(file.name) ? 'heic' : 'unreadable')
	}

	try {
		const { width, height } = bitmap
		if (Math.min(width, height) < UPLOAD_MIN_SIDE) throw new UploadRejected('small')
		if (width * height > UPLOAD_MAX_MP * 1_000_000) throw new UploadRejected('large')

		const scale = Math.min(1, LONG_SIDE / Math.max(width, height))
		const canvas = document.createElement('canvas')
		canvas.width = Math.round(width * scale)
		canvas.height = Math.round(height * scale)

		const ctx = canvas.getContext('2d')
		if (!ctx) throw new UploadRejected('unreadable')
		ctx.imageSmoothingQuality = 'high'
		ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
		if (!blob) throw new UploadRejected('unreadable')

		return URL.createObjectURL(blob)
	} finally {
		bitmap.close()
	}
}

export function droppedFiles(event: DragEvent) {
	return [...(event.dataTransfer?.files ?? [])]
}
