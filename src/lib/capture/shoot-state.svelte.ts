import { untrack } from 'svelte'
import { browser } from '$app/environment'
import { goto } from '$app/navigation'
import { asset } from '$app/paths'
import { BurstRecorder } from '$lib/capture/burst'
import { Camera, TIMERS } from '$lib/capture/camera.svelte'
import { UploadRejected, importPhoto, type UploadProblem } from '$lib/capture/upload'
import { frameQuery } from '$lib/frames/requested'
import { m } from '$lib/paraglide/messages'
import { localizeHref } from '$lib/paraglide/runtime'
import { SIZES, type Frame, type SizeSpec } from '$lib/session/session'
import { addPhoto, firstEmptyShot, shots, slotOfShot, useShots, type PhotoSource } from '$lib/session/shots.svelte'
import { revoke } from '$lib/storage/blobs'

export type Upload = {
	id: number
	name: string
	status: 'loading' | 'placed' | 'kept' | 'error'
	url?: string
	slot?: number
	problem?: UploadProblem
}

const TICK_MS = 1000
const FLASH_MS = 700
const FLASH_LEAD_MS = 300

export class ShootState {
	frame: Frame
	spec: SizeSpec
	total: number
	next: string
	back: string
	retake: number | null
	camera = new Camera()
	burst = new BurstRecorder()

	video = $state<HTMLVideoElement>()
	timer = $state<number>(TIMERS[0])
	phase = $state<number | 'flash' | null>(null)
	isMuted = $state(false)
	isFlashOn = $state(false)
	isLit = $state(false)
	source = $state<PhotoSource>('camera')
	uploads = $state<Upload[]>([])
	isImporting = $state(false)
	hasRetaken = $state(false)

	#sound: HTMLAudioElement | undefined
	#isAlive = true
	#uploadSequence = 0

	taken = $derived(shots.photos.filter(Boolean).length)
	target = $derived.by(() => this.retake ?? firstEmptyShot(this.total) ?? this.total)
	targetSlot = $derived.by(() => (this.target < this.total ? slotOfShot(this.target) : this.total))
	isComplete = $derived.by(() => (this.retake === null ? this.taken >= this.total : this.hasRetaken))
	remaining = $derived.by(() => (this.isComplete ? 0 : this.retake === null ? this.total - this.taken : 1))
	current = $derived.by(() => Math.min(this.targetSlot + 1, this.total))
	isBusy = $derived(this.phase !== null)
	isReady = $derived(
		this.source === 'camera' && this.camera.status === 'live' && !this.isBusy && !this.isComplete && !this.isImporting
	)
	lastShot = $derived.by(() =>
		Array.from({ length: this.total }, (_, index) => this.shotAt(index))
			.filter((shot) => shots.photos[shot])
			.at(-1)
	)
	hint = $derived(
		this.isComplete
			? m['session.shoot.hint_done']()
			: this.isBusy
				? m['session.shoot.hint_busy']()
				: m['session.shoot.hint_idle']()
	)
	hud = $derived.by(() =>
		[
			m['session.shoot.shot_hud']({ n: this.current, total: this.total }),
			this.camera.isMirrored && m['session.shoot.mirror']()
		]
			.filter(Boolean)
			.join(' · ')
	)

	constructor(frame: Frame, search: URLSearchParams) {
		this.frame = frame
		this.spec = SIZES[frame.size]
		this.total = frame.slots.length

		const query = frameQuery(frame)
		const redo = search.has('retake') ? Number(search.get('retake')) : NaN
		this.retake = Number.isInteger(redo) && redo >= 0 && redo < this.total ? redo : null
		this.next = localizeHref(`/session/edit?${query}`)
		this.back = this.retake === null ? localizeHref(`/session/frame?${query}`) : this.next

		if (browser) {
			useShots(frame.size, frame.id)
		}

		$effect(() => {
			const mode = this.source
			untrack(() => (mode === 'camera' ? this.camera.start() : this.camera.stop()))
		})
	}

	mount() {
		this.#sound = new Audio(asset('/audio/shutter.mp3'))

		return () => {
			this.#isAlive = false
			this.burst.cancel()
			this.camera.stop()
		}
	}

	shotAt(index: number) {
		return shots.edit?.order[index] ?? index
	}

	cycleTimer() {
		this.timer = TIMERS[(TIMERS.indexOf(this.timer as (typeof TIMERS)[number]) + 1) % TIMERS.length]
	}

	async shoot() {
		if (!this.isReady) {
			return
		}

		if (!(await this.#snap()) || !this.isComplete) {
			this.phase = null
			return
		}

		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(this.next, { replaceState: true })
	}

	async upload(files: File[]) {
		if (!files.length || this.isImporting || this.isBusy) {
			return
		}
		this.isImporting = true

		for (const file of files) {
			this.uploads.push({ id: ++this.#uploadSequence, name: file.name, status: 'loading' })
			const entry = this.uploads[this.uploads.length - 1]

			try {
				const url = await importPhoto(file)
				if (!this.#isAlive) {
					return revoke(url)
				}

				addPhoto({ url, source: 'upload', name: file.name, burst: [] })
				entry.url = url

				if (this.isComplete) {
					entry.status = 'kept'
				} else {
					entry.slot = slotOfShot(this.target) + 1
					this.#place(this.target, url)
					entry.status = 'placed'
				}
			} catch (error) {
				entry.status = 'error'
				entry.problem = error instanceof UploadRejected ? error.problem : 'unreadable'
			}
		}

		this.isImporting = false
		if (this.isComplete && this.#isAlive) {
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto(this.next, { replaceState: true })
		}
	}

	dismiss(id: number) {
		this.uploads = this.uploads.filter((item) => item.id !== id)
	}

	#wait(milliseconds: number) {
		return new Promise<boolean>((resolve) => setTimeout(() => resolve(this.#isAlive), milliseconds))
	}

	async #snap() {
		const shot = this.target
		if (this.video) {
			this.burst.start(this.video, this.camera.isMirrored)
		}

		for (const remainingSeconds of Array.from({ length: this.timer }, (_, index) => this.timer - index)) {
			this.phase = remainingSeconds
			if (!(await this.#wait(TICK_MS))) {
				this.burst.cancel()
				return false
			}
		}

		if (this.camera.status !== 'live' || !this.video) {
			this.burst.cancel()
			return false
		}

		if (this.isFlashOn) {
			if (this.camera.canTorch) {
				await this.camera.torch(true)
			} else {
				this.isLit = true
			}
			await this.#wait(FLASH_LEAD_MS)
		}

		this.phase = 'flash'
		if (this.#sound && !this.isMuted) {
			this.#sound.currentTime = 0
			this.#sound.play().catch(() => {})
		}

		try {
			this.burst.grab()
			const frames = this.burst.stop()
			const url = await this.camera.capture(this.video)
			if (!this.#isAlive) {
				revoke(url)
			} else {
				this.#place(shot, addPhoto({ url, source: 'camera', burst: frames }))
			}
		} catch {
			this.burst.cancel()
		}

		if (this.isFlashOn) {
			this.isLit = false
			this.camera.torch(false)
		}

		return this.#wait(FLASH_MS)
	}

	#place(shot: number, url: string) {
		shots.photos[shot] = url
		if (this.retake !== null) {
			this.hasRetaken = true
		}
	}
}
