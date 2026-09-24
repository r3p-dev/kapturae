export type CameraStatus = 'idle' | 'pending' | 'live' | 'denied' | 'unavailable' | 'error'
export type Facing = 'user' | 'environment'

export const TIMERS = [3, 5] as const

export class Camera {
	stream = $state<MediaStream | null>(null)
	status = $state<CameraStatus>('idle')
	facing = $state<Facing>('user')
	canFlip = $state(false)
	canTorch = $state(false)
	mirrored = $state(true)

	async start() {
		this.stop()

		if (!navigator.mediaDevices?.getUserMedia) {
			this.status = 'unavailable'
			return
		}

		this.status = 'pending'
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: false,
				video: { facingMode: this.facing, width: { ideal: 1920 }, height: { ideal: 1080 } }
			})

			if (this.status !== 'pending') {
				stream.getTracks().forEach((track) => track.stop())
				return
			}

			this.stream = stream
			this.status = 'live'
			this.canTorch = 'torch' in (stream.getVideoTracks()[0]?.getCapabilities?.() ?? {})

			const devices = await navigator.mediaDevices.enumerateDevices()
			this.canFlip = devices.filter((device) => device.kind === 'videoinput').length > 1
		} catch (error) {
			const name = error instanceof DOMException ? error.name : ''
			this.status =
				name === 'NotAllowedError' || name === 'SecurityError'
					? 'denied'
					: name === 'NotFoundError' || name === 'OverconstrainedError'
						? 'unavailable'
						: 'error'
		}
	}

	stop() {
		this.stream?.getTracks().forEach((track) => track.stop())
		this.stream = null
		this.status = 'idle'
		this.canTorch = false
	}

	flip() {
		this.facing = this.facing === 'user' ? 'environment' : 'user'
		this.mirrored = this.facing === 'user'
		return this.start()
	}

	async torch(on: boolean) {
		const track = this.stream?.getVideoTracks()[0]
		if (!this.canTorch || !track) return

		await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] }).catch(() => {})
	}

	async capture(video: HTMLVideoElement): Promise<string> {
		const canvas = document.createElement('canvas')
		canvas.width = video.videoWidth
		canvas.height = video.videoHeight

		const ctx = canvas.getContext('2d')
		if (!ctx) throw new Error('2D canvas unavailable')

		if (this.mirrored) {
			ctx.translate(canvas.width, 0)
			ctx.scale(-1, 1)
		}

		ctx.drawImage(video, 0, 0)

		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
		if (!blob) throw new Error('Capture failed')

		return URL.createObjectURL(blob)
	}
}
