<script lang="ts">
	import { onMount, untrack } from 'svelte'
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import { asset } from '$app/paths'
	import { page } from '$app/state'
	import RiAlertLine from 'remixicon-svelte/icons/alert-line'
	import RiArrowLeftLine from 'remixicon-svelte/icons/arrow-left-line'
	import RiCameraLine from 'remixicon-svelte/icons/camera-line'
	import RiCheckLine from 'remixicon-svelte/icons/check-line'
	import RiCloseLine from 'remixicon-svelte/icons/close-line'
	import RiImageLine from 'remixicon-svelte/icons/image-line'
	import RiUploadLine from 'remixicon-svelte/icons/upload-2-line'
	import RiCameraSwitchLine from 'remixicon-svelte/icons/camera-switch-line'
	import RiFlashlightFill from 'remixicon-svelte/icons/flashlight-fill'
	import RiFlashlightLine from 'remixicon-svelte/icons/flashlight-line'
	import RiFlipHorizontalLine from 'remixicon-svelte/icons/flip-horizontal-line'
	import RiVolumeMuteLine from 'remixicon-svelte/icons/volume-mute-line'
	import RiVolumeUpLine from 'remixicon-svelte/icons/volume-up-line'
	import RiSettings3Line from 'remixicon-svelte/icons/settings-3-line'
	import RiTimerLine from 'remixicon-svelte/icons/timer-line'
	import { Popover } from 'bits-ui'
	import CameraFeed from '$lib/components/atoms/camera-feed.svelte'
	import Countdown from '$lib/components/atoms/countdown.svelte'
	import Flash from '$lib/components/atoms/flash.svelte'
	import ShutterButton from '$lib/components/atoms/shutter-button.svelte'
	import Corners from '$lib/components/atoms/corners.svelte'
	import CameraStatus from '$lib/components/molecules/camera-status.svelte'
	import Dropzone from '$lib/components/molecules/dropzone.svelte'
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import SessionHeader from '$lib/components/organisms/session-header.svelte'
	import FrameImage from '$lib/components/atoms/frame-image.svelte'
	import { BurstRecorder } from '$lib/burst'
	import { Camera, TIMERS } from '$lib/camera.svelte'
	import { m } from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { FRAMES } from '$lib/frames'
	import { PRINT_SIZES, SIZES, pick } from '$lib/session'
	import { UPLOAD_PROBLEMS } from '$lib/session-messages'
	import { addPhoto, firstEmptyShot, photoFor, shots, slotOfShot, useShots, type PhotoSource } from '$lib/shots.svelte'
	import {
		UPLOAD_ACCEPT,
		UPLOAD_MAX_MB,
		UPLOAD_MIN_SIDE,
		UploadRejected,
		importPhoto,
		type UploadProblem
	} from '$lib/upload'
	import { cn } from '$lib/utils'

	type Upload = {
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

	const params = page.url.searchParams
	const requested = pick(PRINT_SIZES, params.get('size')) ?? '2x6'
	const frame =
		FRAMES.find((f) => f.id === params.get('frame')) ?? FRAMES.find((f) => f.size === requested) ?? FRAMES[0]
	const size = frame.size
	const spec = SIZES[size]
	const query = new URLSearchParams({ size, frame: frame.id })
	const next = localizeHref(`/session/edit?${query}`)
	const redo = params.has('retake') ? Number(params.get('retake')) : NaN

	if (browser) useShots(size, frame.id)

	const camera = new Camera()
	const burst = new BurstRecorder()

	let video = $state<HTMLVideoElement>()
	let timer = $state<number>(TIMERS[0])
	let phase = $state<number | 'flash' | null>(null)
	let muted = $state(false)
	let flash = $state(false)
	let lit = $state(false)
	let source = $state<PhotoSource>('camera')
	let uploads = $state<Upload[]>([])
	let importing = $state(false)
	let sound: HTMLAudioElement | undefined
	let alive = true
	let uploadSeq = 0

	const total = frame.slots.length
	const retake = Number.isInteger(redo) && redo >= 0 && redo < total ? redo : null
	const taken = $derived(shots.photos.filter(Boolean).length)
	const target = $derived(retake ?? firstEmptyShot(total) ?? total)
	const targetSlot = $derived(target < total ? slotOfShot(target) : total)
	const shotAt = (i: number) => shots.edit?.order[i] ?? i
	let retaken = $state(false)
	const complete = $derived(retake === null ? taken >= total : retaken)
	const remaining = $derived(complete ? 0 : retake === null ? total - taken : 1)
	const current = $derived(Math.min(targetSlot + 1, total))
	const back = $derived(retake === null ? localizeHref(`/session/frame?${query}`) : next)
	const busy = $derived(phase !== null)
	const ready = $derived(source === 'camera' && camera.status === 'live' && !busy && !complete && !importing)
	const lastShot = $derived(
		Array.from({ length: total }, (_, i) => shotAt(i))
			.filter((shot) => shots.photos[shot])
			.at(-1)
	)
	const hint = $derived(
		complete ? m['session.shoot.hint_done']() : busy ? m['session.shoot.hint_busy']() : m['session.shoot.hint_idle']()
	)

	const hud = $derived(
		[m['session.shoot.shot_hud']({ n: current, total }), camera.mirrored && m['session.shoot.mirror']()]
			.filter(Boolean)
			.join(' · ')
	)

	let guideWidth = $state(0)
	let guideHeight = $state(0)

	const view = $derived.by(() => {
		const slot = frame.slots[targetSlot] ?? { x: 0, y: 0, w: 100, h: 100 }
		const h = Math.min(guideWidth / ((slot.w / 100) * spec.ratio), guideHeight / (slot.h / 100))

		return {
			h,
			x: guideWidth / 2 - ((slot.x + slot.w / 2) / 100) * h * spec.ratio,
			y: guideHeight / 2 - ((slot.y + slot.h / 2) / 100) * h
		}
	})

	const wait = (ms: number) => new Promise<boolean>((resolve) => setTimeout(() => resolve(alive), ms))

	async function shoot() {
		if (!ready) return

		if (!(await snap()) || !complete) {
			phase = null
			return
		}

		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(next, { replaceState: true })
	}

	async function snap() {
		const shot = target
		if (video) burst.start(video, camera.mirrored)

		for (let n = timer; n > 0; n--) {
			phase = n
			if (!(await wait(TICK_MS))) {
				burst.cancel()
				return false
			}
		}

		if (camera.status !== 'live' || !video) {
			burst.cancel()
			return false
		}

		if (flash) {
			if (camera.canTorch) await camera.torch(true)
			else lit = true
			await wait(FLASH_LEAD_MS)
		}

		phase = 'flash'
		if (sound && !muted) {
			sound.currentTime = 0
			sound.play().catch(() => {})
		}

		try {
			burst.grab()
			const frames = burst.stop()
			const url = await camera.capture(video)
			if (!alive) URL.revokeObjectURL(url)
			else place(shot, addPhoto({ url, source: 'camera', burst: frames }))
		} catch {
			burst.cancel()
		}

		if (flash) {
			lit = false
			camera.torch(false)
		}

		return wait(FLASH_MS)
	}

	function place(shot: number, url: string) {
		shots.photos[shot] = url
		if (retake !== null) retaken = true
	}

	async function upload(files: File[]) {
		if (!files.length || importing || busy) return
		importing = true

		for (const file of files) {
			uploads.push({ id: ++uploadSeq, name: file.name, status: 'loading' })
			const entry = uploads[uploads.length - 1]

			try {
				const url = await importPhoto(file)
				if (!alive) return URL.revokeObjectURL(url)

				addPhoto({ url, source: 'upload', name: file.name, burst: [] })
				entry.url = url

				if (complete) entry.status = 'kept'
				else {
					entry.slot = slotOfShot(target) + 1
					place(target, url)
					entry.status = 'placed'
				}
			} catch (error) {
				entry.status = 'error'
				entry.problem = error instanceof UploadRejected ? error.problem : 'unreadable'
			}
		}

		importing = false
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		if (complete && alive) goto(next, { replaceState: true })
	}

	function pickFiles(e: Event & { currentTarget: HTMLInputElement }) {
		const files = [...(e.currentTarget.files ?? [])]
		e.currentTarget.value = ''
		upload(files)
	}

	function dismiss(id: number) {
		uploads = uploads.filter((item) => item.id !== id)
	}

	$effect(() => {
		const mode = source
		untrack(() => (mode === 'camera' ? camera.start() : camera.stop()))
	})

	const toggles = $derived([
		{
			label: m['session.shoot.mirror_toggle'](),
			on: camera.mirrored,
			icon: RiFlipHorizontalLine,
			locked: true,
			flip: () => (camera.mirrored = !camera.mirrored)
		},
		{
			label: m['session.shoot.sound'](),
			on: !muted,
			icon: muted ? RiVolumeMuteLine : RiVolumeUpLine,
			locked: false,
			flip: () => (muted = !muted)
		},
		{
			label: m['session.shoot.flash'](),
			on: flash,
			icon: flash ? RiFlashlightFill : RiFlashlightLine,
			locked: true,
			flip: () => (flash = !flash)
		}
	])

	const sources = [
		{ value: 'camera', icon: RiCameraLine, label: m['session.source.camera'], short: m['session.source.camera'] },
		{ value: 'upload', icon: RiUploadLine, label: m['session.source.upload'], short: m['session.source.gallery'] }
	] as const

	function cycleTimer() {
		timer = TIMERS[(TIMERS.indexOf(timer as (typeof TIMERS)[number]) + 1) % TIMERS.length]
	}

	onMount(() => {
		sound = new Audio(asset('/shutter.mp3'))

		return () => {
			alive = false
			burst.cancel()
			camera.stop()
		}
	})

	const mono = 'font-mono tracking-[0.14em] uppercase'
	const pill = 'flex size-11 items-center justify-center rounded-full bg-ink/45 text-paper'
	const chip = 'border border-[#3a3936] px-2.5 py-1.5'
	const tile =
		'flex h-11 min-w-11 items-center justify-center gap-1.5 border-[1.5px] border-foreground px-2.5 font-mono text-[13px] aria-pressed:bg-foreground aria-pressed:text-background disabled:opacity-50'
</script>

<svelte:head>
	<title>{m['session.shoot.meta_title']()}</title>
	<meta name="description" content={m['session.shoot.meta_description']()} />
</svelte:head>

{#snippet slotPhoto(i: number)}
	{@const shot = shotAt(i)}
	{@const photo = photoFor(shots.photos[shot])}
	{@const waiting = shot === target && !complete}

	{#if waiting && source === 'camera' && camera.stream}
		<CameraFeed
			stream={camera.stream}
			mirrored={camera.mirrored}
			class="absolute inset-0 outline-3 -outline-offset-3 outline-primary"
		/>
	{:else if shots.photos[shot]}
		<img src={shots.photos[shot]} alt="" class="absolute inset-0 size-full object-cover" />

		{#if photo}
			<span
				class="absolute top-1.5 left-1.5 flex items-center gap-1 bg-ink px-1.5 py-0.75 font-mono text-[10px] tracking-[0.08em] text-paper uppercase"
			>
				{#if photo.source === 'upload'}
					<RiUploadLine aria-hidden="true" class="size-2.75" />
				{:else}
					<RiCameraLine aria-hidden="true" class="size-2.75" />
				{/if}
				{photo.source === 'upload' ? m['session.source.upload']() : m['session.source.camera']()}
			</span>
		{/if}
	{:else}
		<span
			class={cn(
				'absolute inset-0 flex flex-col items-center justify-center gap-1',
				waiting ? 'bg-[#2a2a28] outline-3 -outline-offset-3 outline-primary' : 'text-[#8c8983]'
			)}
		>
			<span class="font-display text-[22px] font-black">{i + 1}</span>
			{#if waiting}
				<span class="font-mono text-[10px] tracking-[0.1em] text-body uppercase">
					{source === 'upload' ? m['session.upload.waiting']() : m['session.upload.next']()}
				</span>
			{/if}
		</span>
	{/if}
{/snippet}

{#snippet uploadThumb(item: Upload, cls: string)}
	{#if item.status === 'error'}
		<span class="flex shrink-0 items-center justify-center border-[1.5px] border-primary bg-[#2a2a28] {cls}">
			<RiAlertLine aria-hidden="true" class="size-1/3 text-primary" />
		</span>
	{:else if item.url}
		<img src={item.url} alt="" class="shrink-0 object-cover {cls}" />
	{:else}
		<span class="shrink-0 animate-pulse bg-[#8a7560]/50 motion-reduce:animate-none {cls}"></span>
	{/if}
{/snippet}

{#snippet uploadStatus(item: Upload)}
	{#if item.status === 'error'}
		<span class="text-xs leading-snug text-body">{UPLOAD_PROBLEMS[item.problem ?? 'unreadable']()}</span>
	{:else}
		<span class="{mono} flex items-center gap-1.5 text-[11px] tracking-[0.1em] text-body">
			{#if item.status === 'placed'}
				<RiCheckLine aria-hidden="true" class="size-3.5 text-paper" />
				{m['session.upload.placed']({ n: item.slot ?? 0 })}
			{:else if item.status === 'kept'}
				{m['session.upload.kept']()}
			{:else}
				{m['session.upload.loading']()}
			{/if}
		</span>
	{/if}
{/snippet}

{#snippet dismissButton(item: Upload)}
	<button
		type="button"
		onclick={() => dismiss(item.id)}
		aria-label={m['session.upload.dismiss']({ name: item.name })}
		class="flex size-11 shrink-0 items-center justify-center border border-[#3a3936] text-paper hover:border-paper"
	>
		<RiCloseLine aria-hidden="true" class="size-4" />
	</button>
{/snippet}

{#snippet sourceSwitch()}
	<ToggleGroup.Root
		type="single"
		aria-label={m['session.source.label']()}
		disabled={busy || importing}
		bind:value={() => source, (next) => next && (source = next as PhotoSource)}
		class="border-[1.5px] border-foreground"
	>
		{#each sources as item (item.value)}
			<ToggleGroup.Item
				value={item.value}
				class="h-11 gap-2 border-0 px-4.5 font-mono text-xs font-normal tracking-[0.12em] hover:bg-foreground/10 data-[state=on]:bg-foreground data-[state=on]:text-background"
			>
				<item.icon aria-hidden="true" class="size-4" />
				{item.label()}
			</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>
{/snippet}

<div class="dark relative isolate flex h-svh flex-col overflow-hidden bg-background text-foreground scheme-dark">
	<div aria-hidden="true" class="absolute inset-0 -z-10 rail:hidden" style:background-color={frame.color}></div>

	<SessionHeader step="shoot" class="hidden rail:flex" />

	<div class="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center px-2 rail:hidden">
		<a
			href={back}
			aria-label={retake === null ? m['session.shoot.back']() : m['session.shoot.back_editor']()}
			class={pill}
		>
			<RiArrowLeftLine aria-hidden="true" class="size-5" />
		</a>

		<span class="{mono} bg-ink/55 px-2.5 py-1.5 text-xs text-paper">
			{m['session.shoot.shot_hud']({ n: current, total })}
		</span>

		{#if camera.canFlip && source === 'camera'}
			<button
				type="button"
				onclick={() => camera.flip()}
				disabled={busy}
				aria-label={m['session.shoot.flip']()}
				class={cn(pill, 'justify-self-end disabled:opacity-50')}
			>
				<RiCameraSwitchLine aria-hidden="true" class="size-5" />
			</button>
		{/if}
	</div>

	<div aria-hidden="true" class="mt-1 flex justify-center gap-1.5 rail:hidden">
		{#each { length: total }, i (i)}
			<span
				class="h-1 w-10"
				style:background-color={shotAt(i) === target && !complete
					? 'var(--primary)'
					: `color-mix(in srgb, ${frame.ink} ${shots.photos[shotAt(i)] ? 100 : 30}%, transparent)`}
			></span>
		{/each}
	</div>

	<div class="flex min-h-0 flex-1 flex-col rail:flex-row rail:gap-6 rail:px-8 rail:pt-5 rail:pb-6">
		<div class="flex min-h-0 min-w-0 flex-1 flex-col rail:gap-3">
			<div class="hidden h-11 shrink-0 items-center justify-between gap-4 rail:flex">
				{@render sourceSwitch()}

				<span class="{mono} text-xs text-muted-foreground">
					{#if complete}
						{m['session.shoot.hint_done']()}
					{:else}
						{m['session.upload.filling']()}
						<span class="text-foreground">{current} / {total}</span>
					{/if}
				</span>
			</div>

			{#if source === 'upload'}
				<div class="hidden min-h-0 flex-1 flex-col gap-4 bg-[#1b1b19] p-6 rail:flex">
					<Dropzone
						onfiles={upload}
						disabled={importing || complete}
						class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4.5 overflow-y-auto border-2 border-dashed border-[#5a5853] p-6 text-center"
					>
						<Corners inset="16px" size="28px" weight="3px" class="text-primary" />
						<RiUploadLine aria-hidden="true" class="size-13 shrink-0 text-primary" />

						<h2
							class="m-0 font-display text-4xl leading-[0.92] font-black uppercase font-stretch-118% desktop:text-5xl"
						>
							{m['session.upload.drop_title']()}
						</h2>

						<p class="m-0 max-w-120 text-base leading-[1.55] text-body">
							{retake === null ? m['session.upload.drop_body']() : m['session.upload.drop_body_single']()}
						</p>

						<label
							class={cn(
								'flex h-13 shrink-0 items-center gap-2.5 bg-primary px-8 font-mono text-[13px] font-medium tracking-[0.12em] text-primary-foreground uppercase hover:bg-primary/80 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-paper',
								importing || complete ? 'pointer-events-none opacity-50' : 'cursor-pointer'
							)}
						>
							<input
								type="file"
								accept={UPLOAD_ACCEPT}
								multiple={retake === null}
								disabled={importing || complete}
								onchange={pickFiles}
								class="sr-only"
							/>
							<RiImageLine aria-hidden="true" class="size-4.5" />
							{m['session.upload.pick']()}
						</label>

						<div class="{mono} flex flex-wrap justify-center gap-2 text-[11px] tracking-[0.1em] text-muted-foreground">
							<span class={chip}>{m['session.upload.formats']()}</span>
							<span class={chip}>{m['session.upload.max_size']({ n: UPLOAD_MAX_MB })}</span>
							<span class={chip}>{m['session.upload.min_side']({ n: UPLOAD_MIN_SIDE })}</span>
							<span class={chip}>{m['session.upload.auto_crop']()}</span>
						</div>

						<span class="text-[13px] text-muted-foreground">{m['session.upload.retention']()}</span>
					</Dropzone>

					{#if uploads.length}
						<div class="flex h-24 shrink-0 gap-3">
							<div class="{mono} flex w-30 shrink-0 flex-col justify-center gap-1 text-[11px] text-muted-foreground">
								<span>{m['session.upload.uploads']()}</span>
								<span class="font-display text-[28px] leading-none font-black tracking-normal text-foreground">
									{uploads.length}
								</span>
							</div>

							<ul class="m-0 flex min-w-0 flex-1 list-none gap-3 overflow-x-auto p-0" aria-live="polite">
								{#each uploads as item (item.id)}
									<li class="flex min-w-62 flex-1 basis-0 items-center gap-3 bg-[#232321] p-3">
										{@render uploadThumb(item, 'size-18')}

										<div class="flex min-w-0 flex-1 flex-col gap-1.5">
											<span class="truncate font-mono text-xs">{item.name}</span>
											{#if item.status === 'loading'}
												<div
													role="progressbar"
													aria-label={m['session.upload.loading_file']({ name: item.name })}
													class="h-1 bg-[#3a3936]"
												>
													<div class="h-full animate-pulse bg-primary motion-reduce:animate-none"></div>
												</div>
											{/if}
											{@render uploadStatus(item)}
										</div>

										{#if item.status === 'error'}{@render dismissButton(item)}{/if}
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{/if}

			<section
				aria-label={source === 'camera' ? m['session.shoot.camera_label']() : m['session.upload.label']()}
				class={cn(
					'relative mx-5 mt-4 mb-4 min-h-0 flex-1 overflow-hidden bg-[#262624] rail:m-0 rail:bg-[#232321]',
					source === 'upload' && 'rail:hidden'
				)}
			>
				{#if source === 'upload'}
					<Dropzone
						onfiles={upload}
						disabled={importing || complete}
						class="absolute inset-4 flex flex-col items-center justify-center gap-3.5 overflow-y-auto border-2 border-dashed border-[#5a5853] p-5 text-center"
					>
						<RiImageLine aria-hidden="true" class="size-11 shrink-0 text-primary" />

						<h2 class="m-0 font-display text-[26px] leading-[0.95] font-black uppercase font-stretch-112%">
							{complete ? m['session.shoot.hint_done']() : m['session.upload.pick_for_slot']({ n: current })}
						</h2>

						{#if !complete}
							<p class="m-0 text-sm leading-normal text-body">
								{remaining > 1 ? m['session.upload.pick_many']({ n: remaining }) : m['session.upload.pick_one']()}
							</p>
						{/if}

						<div class="{mono} flex flex-col items-center gap-1.5 text-[10px] tracking-[0.1em] text-muted-foreground">
							<span>{m['session.upload.formats']()} · {m['session.upload.max_size']({ n: UPLOAD_MAX_MB })}</span>
							<span>{m['session.upload.auto_crop']()}</span>
						</div>

						{#if uploads.length}
							<ul class="m-0 flex w-full list-none flex-col gap-1.5 p-0 text-left" aria-live="polite">
								{#each uploads.slice(-3) as item (item.id)}
									<li class="flex min-h-11 items-center gap-2.5 bg-ink/40 p-1.5">
										{@render uploadThumb(item, 'size-8')}
										<div class="flex min-w-0 flex-1 flex-col gap-0.5">
											<span class="truncate font-mono text-[11px]">{item.name}</span>
											{@render uploadStatus(item)}
										</div>
										{#if item.status === 'error'}{@render dismissButton(item)}{/if}
									</li>
								{/each}
							</ul>
						{/if}
					</Dropzone>
				{:else if camera.status === 'live'}
					<CameraFeed stream={camera.stream} mirrored={camera.mirrored} bind:video />

					<div
						aria-hidden="true"
						bind:clientWidth={guideWidth}
						bind:clientHeight={guideHeight}
						class="absolute inset-0 bg-[#262624] rail:hidden"
					>
						{#if guideWidth && guideHeight}
							<div
								class="transition-transform duration-700 ease-out motion-reduce:transition-none"
								style:transform="translate({view.x}px, {view.y}px)"
								style:--h="{view.h}px"
							>
								<FrameImage
									{frame}
									photo={slotPhoto}
									class="transition-[width,height] duration-700 ease-out motion-reduce:transition-none"
								/>
							</div>
						{/if}
					</div>
				{:else}
					<CameraStatus status={camera.status} onretry={() => camera.start()} class="absolute inset-0 rail:bottom-32" />
				{/if}

				{#if source === 'camera'}
					<div aria-hidden="true" class="pointer-events-none absolute inset-0 hidden rail:block">
						<span class="absolute inset-y-0 left-1/3 w-px bg-paper/10"></span>
						<span class="absolute inset-y-0 left-2/3 w-px bg-paper/10"></span>
						<span class="absolute inset-x-0 top-1/3 h-px bg-paper/10"></span>
						<span class="absolute inset-x-0 top-2/3 h-px bg-paper/10"></span>
					</div>

					<Corners inset="24px" size="44px" weight="3px" class="hidden text-paper rail:block" />
				{/if}

				{#if source === 'camera' && camera.status === 'live'}
					<div
						class="{mono} absolute inset-x-22 top-10 hidden items-center justify-between text-[13px] text-paper rail:flex"
					>
						<span class="flex items-center gap-2">
							<span
								aria-hidden="true"
								class="size-2.5 animate-rec-blink rounded-full bg-primary motion-reduce:animate-none"
							></span>
							{m['session.shoot.live']()}
						</span>

						<span>{hud}</span>
					</div>

					<span
						class="{mono} absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 bg-ink/55 px-2.5 py-1.5 text-xs text-paper rail:hidden"
					>
						<span
							aria-hidden="true"
							class="size-1.75 animate-rec-blink rounded-full bg-primary motion-reduce:animate-none"
						></span>
						{m['session.shoot.live']()}
					</span>
				{/if}

				{#if typeof phase === 'number'}
					<Countdown
						value={phase}
						class="absolute z-10 bg-transparent rail:bottom-32"
						digitClass="text-[180px] text-paper/92 rail:text-[320px] rail:text-primary"
					/>
				{:else if phase === 'flash'}
					<Flash class="absolute z-30" />
				{/if}

				<div
					class="fixed inset-x-0 bottom-0 z-20 flex h-45 flex-col bg-ink/86 px-6 pt-1 pb-4 rail:absolute rail:h-32 rail:bg-ink/78 rail:px-10 rail:pt-0 rail:pb-0"
				>
					<ToggleGroup.Root
						type="single"
						aria-label={m['session.source.label']()}
						disabled={busy || importing}
						bind:value={() => source, (next) => next && (source = next as PhotoSource)}
						class="h-12 w-full shrink-0 justify-center gap-2 rail:hidden"
					>
						{#each sources as item (item.value)}
							<ToggleGroup.Item
								value={item.value}
								class="h-11 min-w-22 flex-col gap-1 bg-transparent font-mono text-xs font-normal tracking-[0.14em] text-muted-foreground hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:font-medium data-[state=on]:text-paper"
							>
								{item.short()}
								<span aria-hidden="true" class="size-1.25 rounded-full group-data-[state=on]/toggle:bg-primary"></span>
							</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>

					<div class="flex min-h-0 flex-1 items-center justify-between gap-4">
						<div class="flex w-24 gap-1.5 rail:hidden">
							{#if lastShot !== undefined}
								{@const last = photoFor(shots.photos[lastShot])}
								<span class="relative size-11 shrink-0">
									<img src={shots.photos[lastShot]} alt="" class="size-11 border-2 border-paper object-cover" />
									{#if last}
										<span class="absolute top-0.5 left-0.5 text-paper">
											{#if last.source === 'upload'}
												<RiUploadLine aria-hidden="true" class="size-3" />
											{:else}
												<RiCameraLine aria-hidden="true" class="size-3" />
											{/if}
										</span>
									{/if}
								</span>
							{/if}
							{#if !complete}
								<span
									class={cn(
										'size-11 border-2 border-dashed',
										source === 'upload' ? 'border-primary' : 'border-[#8c8983]'
									)}
								></span>
							{/if}
						</div>

						<div class="hidden flex-1 items-center gap-2 rail:flex">
							<button
								type="button"
								onclick={cycleTimer}
								disabled={busy}
								aria-label={m['session.shoot.timer_cycle']({ n: timer })}
								class={tile}
							>
								<RiTimerLine aria-hidden="true" class="size-4.5" />
								{timer}s
							</button>

							{#each toggles as item (item.label)}
								<button
									type="button"
									onclick={item.flip}
									disabled={item.locked && busy}
									aria-pressed={item.on}
									aria-label={item.label}
									title={item.label}
									class={tile}
								>
									<item.icon aria-hidden="true" class="size-4.5" />
								</button>
							{/each}

							{#if camera.canFlip}
								<button
									type="button"
									onclick={() => camera.flip()}
									disabled={busy}
									aria-label={m['session.shoot.flip']()}
									title={m['session.shoot.flip']()}
									class={tile}
								>
									<RiCameraSwitchLine aria-hidden="true" class="size-4.5" />
								</button>
							{/if}
						</div>

						{#if source === 'camera'}
							<ShutterButton
								onclick={shoot}
								aria-label={m['session.shoot.shutter']()}
								aria-disabled={!ready}
								class="shrink-0 aria-disabled:opacity-50"
							/>
						{:else}
							<label
								aria-label={m['session.upload.pick_gallery']()}
								class={cn(
									'flex size-21 shrink-0 items-center justify-center rounded-full border-4 border-paper has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-paper',
									importing || complete ? 'pointer-events-none opacity-50' : 'cursor-pointer'
								)}
							>
								<input
									type="file"
									accept={UPLOAD_ACCEPT}
									multiple={retake === null}
									disabled={importing || complete}
									onchange={pickFiles}
									class="sr-only"
								/>
								<span
									class="flex size-15.5 items-center justify-center rounded-full bg-primary text-primary-foreground"
								>
									<RiImageLine aria-hidden="true" class="size-6.5" />
								</span>
							</label>
						{/if}

						{#if source === 'upload'}
							<span
								class="{mono} w-24 text-right text-[10px] leading-[1.4] tracking-[0.08em] text-muted-foreground rail:hidden"
							>
								{m['session.upload.auto_delete']()}
							</span>
						{:else}
							<div class="flex w-24 justify-end rail:hidden">
								<Popover.Root>
									<Popover.Trigger
										aria-label={m['session.shoot.settings']()}
										class="flex h-11 items-center gap-1.5 border-[1.5px] border-paper px-3 font-mono text-xs text-paper"
									>
										<RiSettings3Line aria-hidden="true" class="size-4" />
										{timer}s
									</Popover.Trigger>

									<Popover.Content
										side="top"
										align="end"
										sideOffset={16}
										class="z-40 flex gap-1 rounded-2xl bg-ink/92 p-2 text-paper shadow-lg outline-none"
									>
										<button
											type="button"
											onclick={cycleTimer}
											disabled={busy}
											aria-label={m['session.shoot.timer_cycle']({ n: timer })}
											class="group flex w-16 flex-col items-center gap-1 py-1 disabled:opacity-50"
										>
											<span class="grid size-11 place-items-center rounded-full bg-paper text-ink">
												<RiTimerLine aria-hidden="true" class="size-5" />
											</span>
											<span class="{mono} text-[10px]">{timer}s</span>
										</button>

										{#each toggles as item (item.label)}
											<button
												type="button"
												onclick={item.flip}
												disabled={item.locked && busy}
												aria-pressed={item.on}
												aria-label={item.label}
												class="group flex w-16 flex-col items-center gap-1 py-1 disabled:opacity-50"
											>
												<span
													class="grid size-11 place-items-center rounded-full bg-paper/12 group-aria-pressed:bg-paper group-aria-pressed:text-ink"
												>
													<item.icon aria-hidden="true" class="size-5" />
												</span>
												<span class="{mono} text-[10px]">{item.label}</span>
											</button>
										{/each}
									</Popover.Content>
								</Popover.Root>
							</div>
						{/if}

						<div class="hidden flex-1 flex-col items-end gap-1 desktop:flex">
							<span class="font-display text-3xl leading-none font-black font-stretch-118%">
								{m['session.shoot.shot']({ n: current, total })}
							</span>

							<span aria-hidden="true" class="{mono} text-[11px] tracking-[0.12em] text-muted-foreground">
								{hint}
							</span>
						</div>
					</div>
				</div>
			</section>
		</div>

		<p class="sr-only" aria-live="polite">{hint}</p>

		<div aria-hidden="true" class="h-45 shrink-0 rail:hidden"></div>

		<aside
			aria-label={m['session.shoot.in_frame']()}
			class="hidden w-(--w) shrink-0 flex-col items-center gap-4 [--w:280px] rail:flex desktop:[--w:340px]"
		>
			<span class="{mono} flex justify-between self-stretch text-xs text-muted-foreground">
				<span>{m['session.shoot.in_frame']()}</span>
				<span>{spec.label} · {frame.name}</span>
			</span>

			<div
				class="flex min-h-0 flex-1 items-center"
				style:--h="min(588px, calc(100svh - 250px), calc(var(--w) / {spec.ratio}))"
			>
				<FrameImage {frame} photo={slotPhoto} />
			</div>

			<p class="m-0 self-stretch text-center text-[13px] leading-normal text-muted-foreground">
				{m['session.shoot.note']()}
			</p>
		</aside>
	</div>

	{#if lit}
		<div aria-hidden="true" class="pointer-events-none fixed inset-0 z-50 bg-white"></div>
	{/if}
</div>
