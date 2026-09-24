export const BURST_FPS = 10
export const BURST_WIDTH = 480
export const BURST_QUALITY = 0.7
export const BURST_MAX = BURST_FPS * 3
export const LOOP_FRAMES = 18
export const LOOP_DELAY = 1000 / BURST_FPS

export function sampleIndexes(length: number, max: number) {
	if (length <= 1) return [0]
	if (length <= max) return Array.from({ length }, (_, i) => i)
	return Array.from({ length: max }, (_, i) => Math.round((i * (length - 1)) / (max - 1)))
}

export class BurstRecorder {
	#timer: ReturnType<typeof setInterval> | null = null
	#canvas: HTMLCanvasElement | null = null
	#video: HTMLVideoElement | null = null
	#frames: string[] = []
	#mirrored = true

	start(video: HTMLVideoElement, mirrored: boolean) {
		this.cancel()
		this.#video = video
		this.#mirrored = mirrored
		this.#timer = setInterval(() => this.grab(), 1000 / BURST_FPS)
	}

	grab() {
		const video = this.#video
		if (!video?.videoWidth) return

		this.#canvas ??= document.createElement('canvas')
		const width = Math.min(BURST_WIDTH, video.videoWidth)
		const height = Math.round((width * video.videoHeight) / video.videoWidth)
		this.#canvas.width = width
		this.#canvas.height = height

		const ctx = this.#canvas.getContext('2d')
		if (!ctx) return

		if (this.#mirrored) {
			ctx.translate(width, 0)
			ctx.scale(-1, 1)
		}
		ctx.drawImage(video, 0, 0, width, height)

		this.#frames.push(this.#canvas.toDataURL('image/jpeg', BURST_QUALITY))
		if (this.#frames.length > BURST_MAX) this.#frames = this.#frames.slice(-BURST_MAX)
	}

	stop() {
		this.#halt()
		const frames = this.#frames
		this.#frames = []
		return frames
	}

	cancel() {
		this.#halt()
		this.#frames = []
	}

	#halt() {
		if (this.#timer) clearInterval(this.#timer)
		this.#timer = null
		this.#video = null
	}
}
