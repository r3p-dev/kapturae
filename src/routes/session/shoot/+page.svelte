<script lang="ts">
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import { asset } from '$app/paths'
	import { page } from '$app/state'
	import RiArrowLeftLine from 'remixicon-svelte/icons/arrow-left-line'
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
	import SessionHeader from '$lib/components/organisms/session-header.svelte'
	import FrameImage from '$lib/components/atoms/frame-image.svelte'
	import { Camera } from '$lib/camera.svelte'
	import { m } from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { FRAMES } from '$lib/frames'
	import { PRINT_SIZES, SIZES, pick } from '$lib/session'
	import { shots, useShots } from '$lib/shots.svelte'
	import { cn } from '$lib/utils'

	const TIMERS = [3, 5, 10] as const
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

	let video = $state<HTMLVideoElement>()
	let timer = $state<number>(TIMERS[0])
	let phase = $state<number | 'flash' | null>(null)
	let muted = $state(false)
	let flash = $state(false)
	let lit = $state(false)
	let sound: HTMLAudioElement | undefined
	let alive = true

	const total = frame.slots.length
	const taken = $derived(shots.photos.length)
	const retake = $derived(Number.isInteger(redo) && redo >= 0 && redo < taken ? redo : null)
	const target = $derived(retake ?? taken)
	const shotAt = (i: number) => shots.edit?.order[i] ?? i
	let retaken = $state(false)
	const complete = $derived(retake === null ? taken >= total : retaken)
	const current = $derived(Math.min(target + 1, total))
	const back = $derived(retake === null ? localizeHref(`/session/frame?${query}`) : next)
	const busy = $derived(phase !== null)
	const ready = $derived(camera.status === 'live' && !busy && !complete)
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
		const slot = frame.slots[target] ?? { x: 0, y: 0, w: 100, h: 100 }
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
		for (let n = timer; n > 0; n--) {
			phase = n
			if (!(await wait(TICK_MS))) return false
		}

		if (camera.status !== 'live' || !video) return false

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
			const url = await camera.capture(video)
			if (!alive) URL.revokeObjectURL(url)
			else if (retake === null) shots.photos.push(url)
			else {
				URL.revokeObjectURL(shots.photos[retake])
				shots.photos[retake] = url
				retaken = true
			}
		} catch {}

		if (flash) {
			lit = false
			camera.torch(false)
		}

		return wait(FLASH_MS)
	}

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

	function cycleTimer() {
		timer = TIMERS[(TIMERS.indexOf(timer as (typeof TIMERS)[number]) + 1) % TIMERS.length]
	}

	onMount(() => {
		sound = new Audio(asset('/shutter.mp3'))
		camera.start()

		return () => {
			alive = false
			camera.stop()
		}
	})

	const mono = 'font-mono tracking-[0.14em] uppercase'
	const pill = 'flex size-11 items-center justify-center rounded-full bg-ink/45 text-paper'
	const tile =
		'flex h-11 min-w-11 items-center justify-center gap-1.5 border-[1.5px] border-foreground px-2.5 font-mono text-[13px] aria-pressed:bg-foreground aria-pressed:text-background disabled:opacity-50'
</script>

<svelte:head>
	<title>{m['session.shoot.meta_title']()}</title>
	<meta name="description" content={m['session.shoot.meta_description']()} />
</svelte:head>

{#snippet slotPhoto(i: number)}
	{@const shot = shotAt(i)}

	{#if shot === target && !complete && camera.stream}
		<CameraFeed
			stream={camera.stream}
			mirrored={camera.mirrored}
			class="absolute inset-0 outline-3 -outline-offset-3 outline-primary"
		/>
	{:else if shots.photos[shot]}
		<img src={shots.photos[shot]} alt="" class="absolute inset-0 size-full object-cover" />
	{:else}
		<span class="absolute inset-0 flex items-center justify-center font-display text-[22px] font-black text-[#8c8983]">
			{i + 1}
		</span>
	{/if}
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

		{#if camera.canFlip}
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
		<section
			aria-label={m['session.shoot.camera_label']()}
			class="relative mx-5 mt-4 mb-4 min-h-0 flex-1 overflow-hidden bg-[#262624] rail:m-0 rail:bg-[#232321]"
		>
			{#if camera.status === 'live'}
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

			<div aria-hidden="true" class="pointer-events-none absolute inset-0 hidden rail:block">
				<span class="absolute inset-y-0 left-1/3 w-px bg-paper/10"></span>
				<span class="absolute inset-y-0 left-2/3 w-px bg-paper/10"></span>
				<span class="absolute inset-x-0 top-1/3 h-px bg-paper/10"></span>
				<span class="absolute inset-x-0 top-2/3 h-px bg-paper/10"></span>
			</div>

			<Corners inset="24px" size="44px" weight="3px" class="hidden text-paper rail:block" />

			{#if camera.status === 'live'}
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
				class="fixed inset-x-0 bottom-0 z-20 flex h-42 items-center justify-between gap-4 bg-ink/82 px-6 pb-4 rail:absolute rail:h-32 rail:bg-ink/78 rail:px-10 rail:pb-0"
			>
				<div class="flex w-24 gap-1.5 rail:hidden">
					{#if taken > 0}
						<img src={shots.photos[taken - 1]} alt="" class="size-11 border-2 border-paper object-cover" />
					{/if}
					<span class="size-11 border-2 border-dashed border-[#8c8983]"></span>
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

				<ShutterButton
					onclick={shoot}
					aria-label={m['session.shoot.shutter']()}
					aria-disabled={!ready}
					class="shrink-0 aria-disabled:opacity-50"
				/>

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

				<div class="hidden flex-1 flex-col items-end gap-1 desktop:flex">
					<span class="font-display text-3xl leading-none font-black font-stretch-118%">
						{m['session.shoot.shot']({ n: current, total })}
					</span>

					<span aria-hidden="true" class="{mono} text-[11px] tracking-[0.12em] text-muted-foreground">
						{hint}
					</span>
				</div>
			</div>
		</section>

		<p class="sr-only" aria-live="polite">{hint}</p>

		<div aria-hidden="true" class="h-42 shrink-0 rail:hidden"></div>

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
