<script lang="ts">
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { asset } from '$app/paths'
	import { page } from '$app/state'
	import RiArrowLeftLine from 'remixicon-svelte/icons/arrow-left-line'
	import RiArrowRightLine from 'remixicon-svelte/icons/arrow-right-line'
	import RiCameraSwitchLine from 'remixicon-svelte/icons/camera-switch-line'
	import RiTimerLine from 'remixicon-svelte/icons/timer-line'
	import CameraFeed from '$lib/components/atoms/camera-feed.svelte'
	import Countdown from '$lib/components/atoms/countdown.svelte'
	import Flash from '$lib/components/atoms/flash.svelte'
	import ShutterButton from '$lib/components/atoms/shutter-button.svelte'
	import Corners from '$lib/components/atoms/corners.svelte'
	import CameraStatus from '$lib/components/molecules/camera-status.svelte'
	import TimerPicker from '$lib/components/molecules/timer-picker.svelte'
	import SessionHeader from '$lib/components/organisms/session-header.svelte'
	import FramePreview from '$lib/components/atoms/frame-preview.svelte'
	import { Button } from '$lib/components/ui/button'
	import { Camera } from '$lib/camera.svelte'
	import { m } from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { DESIGNS, FRAME_DESIGNS, PRINT_SIZES, SIZES, pick } from '$lib/session'
	import { FRAME_NAMES, frameLabel } from '$lib/session-messages'
	import { shots, useShots } from '$lib/shots.svelte'
	import { cn } from '$lib/utils'

	const TIMERS = [3, 5, 10] as const
	const TICK_MS = 1000
	const FLASH_MS = 700

	const params = page.url.searchParams
	const size = pick(PRINT_SIZES, params.get('size')) ?? '2x6'
	const frame = pick(FRAME_DESIGNS, params.get('frame')) ?? 'classic'
	const spec = SIZES[size]
	const design = DESIGNS[frame]
	const query = new URLSearchParams({ size, frame })
	const back = localizeHref(`/session/frame?${query}`)
	const next = localizeHref(`/session/edit?${query}`)

	if (browser) useShots(size, frame)

	const camera = new Camera()

	let video = $state<HTMLVideoElement>()
	let timer = $state<number>(TIMERS[0])
	let phase = $state<number | 'flash' | null>(null)
	let sound: HTMLAudioElement | undefined
	let alive = true

	const total = spec.shots
	const taken = $derived(shots.photos.length)
	const complete = $derived(taken >= total)
	const current = $derived(Math.min(taken + 1, total))
	const ready = $derived(camera.status === 'live' && phase === null && !complete)
	const hint = $derived(
		complete
			? m['session.shoot.hint_done']()
			: phase !== null
				? m['session.shoot.hint_busy']()
				: m['session.shoot.hint_idle']()
	)

	const hud = $derived(
		[
			m['session.shoot.shot_hud']({ n: current, total }),
			camera.mirrored && m['session.shoot.mirror']()
		]
			.filter(Boolean)
			.join(' · ')
	)

	const wait = (ms: number) =>
		new Promise<boolean>((resolve) => setTimeout(() => resolve(alive), ms))

	async function shoot() {
		if (!ready || !video) return

		for (let n = timer; n > 0; n--) {
			phase = n
			if (!(await wait(TICK_MS))) return
		}

		phase = 'flash'
		if (sound) {
			sound.currentTime = 0
			sound.play().catch(() => {})
		}

		try {
			const url = await camera.capture(video)
			if (alive) shots.photos.push(url)
			else URL.revokeObjectURL(url)
		} catch {}

		if (await wait(FLASH_MS)) phase = null
	}

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
</script>

<svelte:head>
	<title>{m['session.shoot.meta_title']()}</title>
	<meta name="description" content={m['session.shoot.meta_description']()} />
</svelte:head>

{#snippet nextButton(cls?: string)}
	<Button
		href={next}
		class={cn(
			'h-14 w-full gap-2.5 font-display text-[15px] font-extrabold tracking-[0.06em] font-stretch-112%',
			cls
		)}
	>
		{m['session.shoot.next']()}
		<RiArrowRightLine aria-hidden="true" class="size-4.5" />
	</Button>
{/snippet}

<div
	class="dark relative isolate flex h-svh flex-col overflow-hidden bg-background text-foreground scheme-dark"
>
	<div
		aria-hidden="true"
		class="absolute inset-0 -z-10 rail:hidden"
		style:background-color={design.bg}
		style:background-image={design.pattern}
		style:background-size={design.patternSize}
	></div>

	<SessionHeader step="shoot" class="hidden rail:flex" />

	<div class="flex h-14 shrink-0 items-center justify-between px-2 rail:hidden">
		<a href={back} aria-label={m['session.shoot.back']()} class={pill}>
			<RiArrowLeftLine aria-hidden="true" class="size-5" />
		</a>

		<span class="{mono} bg-ink/55 px-2.5 py-1.5 text-xs text-paper">
			{m['session.shoot.shot_hud']({ n: current, total })}
		</span>

		{#if camera.canFlip}
			<button
				type="button"
				onclick={() => camera.flip()}
				disabled={phase !== null}
				aria-label={m['session.shoot.flip']()}
				class={pill}
			>
				<RiCameraSwitchLine aria-hidden="true" class="size-5" />
			</button>
		{:else}
			<span class="size-11"></span>
		{/if}
	</div>

	<div aria-hidden="true" class="mt-1 flex justify-center gap-1.5 rail:hidden">
		{#each { length: total }, i (i)}
			<span
				class="h-1 w-10"
				style:background-color={i === taken && !complete
					? frame === 'accent'
						? design.ink
						: 'var(--primary)'
					: `color-mix(in srgb, ${design.ink} ${i < taken ? 100 : 30}%, transparent)`}
			></span>
		{/each}
	</div>

	<div class="flex min-h-0 flex-1 flex-col rail:flex-row rail:gap-6 rail:px-8 rail:pt-5 rail:pb-6">
		<section
			aria-label={m['session.shoot.camera_label']()}
			class="relative mx-5 mt-4 min-h-0 flex-1 overflow-hidden bg-[#262624] rail:m-0 rail:bg-[#232321]"
		>
			{#if camera.status === 'live'}
				<CameraFeed stream={camera.stream} mirrored={camera.mirrored} bind:video />
			{:else}
				<CameraStatus
					status={camera.status}
					onretry={() => camera.start()}
					class="absolute inset-0 rail:bottom-32"
				/>
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
					aria-hidden="true"
					class="pointer-events-none absolute top-1/2 left-1/2 h-40 w-35 -translate-1/2 [--af:18px] rail:h-65 rail:w-57.5 rail:[--af:26px]"
				>
					<Corners size="var(--af)" weight="2px" class="text-primary" />
				</div>

				<div
					class="{mono} absolute inset-x-3 bottom-3 flex items-center gap-1.5 text-[11px] text-paper rail:inset-x-22 rail:top-10 rail:bottom-auto rail:justify-between rail:text-[13px]"
				>
					<span class="flex items-center gap-2">
						<span
							aria-hidden="true"
							class="size-1.75 animate-rec-blink rounded-full bg-primary motion-reduce:animate-none rail:size-2.5"
						></span>
						{m['session.shoot.live']()}
					</span>

					<span class="hidden rail:inline">{hud}</span>
				</div>
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
				{#if complete}
					<div class="flex-1 rail:hidden">{@render nextButton()}</div>
				{/if}

				<div class={cn('w-24 gap-1.5 rail:hidden', complete ? 'hidden' : 'flex')}>
					{#if taken > 0}
						<img
							src={shots.photos[taken - 1]}
							alt=""
							class="size-11 border-2 border-paper object-cover"
						/>
					{/if}
					<span class="size-11 border-2 border-dashed border-[#8c8983]"></span>
				</div>

				<TimerPicker
					bind:value={timer}
					options={TIMERS}
					label={m['session.shoot.timer_label']()}
					disabled={phase !== null}
					class="hidden rail:flex"
				/>

				<ShutterButton
					onclick={shoot}
					aria-label={m['session.shoot.shutter']()}
					aria-disabled={!ready}
					class={cn('shrink-0 aria-disabled:opacity-50', complete && 'hidden rail:inline-flex')}
				/>

				<div class={cn('w-24 justify-end rail:hidden', complete ? 'hidden' : 'flex')}>
					<button
						type="button"
						onclick={cycleTimer}
						disabled={phase !== null}
						aria-label={m['session.shoot.timer_cycle']({ n: timer })}
						class="flex h-11 items-center gap-1.5 border-[1.5px] border-paper px-3 font-mono text-xs text-paper"
					>
						<RiTimerLine aria-hidden="true" class="size-4" />
						{timer}s
					</button>
				</div>

				<div class="hidden w-60 flex-col items-end gap-1 rail:flex">
					<span class="font-display text-3xl leading-none font-black font-stretch-118%">
						{m['session.shoot.shot']({ n: current, total })}
					</span>

					<span
						aria-hidden="true"
						class="{mono} text-[11px] tracking-[0.12em] text-muted-foreground"
					>
						{hint}
					</span>
				</div>
			</div>
		</section>

		<p class="sr-only" aria-live="polite">{hint}</p>

		<div
			class="flex flex-col items-center gap-1 py-4 text-center rail:hidden"
			style:color={design.ink}
		>
			<span class="font-display text-3xl font-black tracking-[0.06em] uppercase font-stretch-115%">
				{frameLabel(frame)}
			</span>
			<span class="{mono} text-[10px] tracking-[0.16em]">
				{m['session.shoot.frame_meta']({
					brand: m['common.brand'](),
					size: spec.label,
					name: FRAME_NAMES[frame]()
				})}
			</span>
		</div>

		<div aria-hidden="true" class="h-42 shrink-0 rail:hidden"></div>

		<aside
			aria-label={m['session.shoot.in_frame']()}
			class="hidden w-(--w) shrink-0 flex-col items-center gap-4 [--w:280px] rail:flex desktop:[--w:340px]"
		>
			<span class="{mono} flex justify-between self-stretch text-xs text-muted-foreground">
				<span>{m['session.shoot.in_frame']()}</span>
				<span>{spec.label} · {FRAME_NAMES[frame]()}</span>
			</span>

			<div
				class="flex min-h-0 flex-1 items-center"
				style:--h="min(588px, calc(100svh - 250px), calc(var(--w) / {spec.ratio}))"
			>
				<FramePreview design={frame} {size}>
					{#snippet photo(i)}
						{#if shots.photos[i]}
							<img src={shots.photos[i]} alt="" class="absolute inset-0 size-full object-cover" />
						{:else if i === taken && camera.stream}
							<CameraFeed
								stream={camera.stream}
								mirrored={camera.mirrored}
								class="absolute inset-0 outline-3 -outline-offset-3 outline-primary"
							/>

							<span
								class="absolute top-1.5 left-1.5 flex items-center gap-1 bg-ink px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-paper uppercase"
							>
								<span
									class="size-1.5 animate-rec-blink rounded-full bg-primary motion-reduce:animate-none"
								></span>
								{m['session.shoot.live']()}
							</span>
						{:else}
							<span
								class="absolute inset-0 flex items-center justify-center font-display text-[22px] font-black text-[#8c8983]"
							>
								{i + 1}
							</span>
						{/if}
					{/snippet}
				</FramePreview>
			</div>

			{#if complete}
				{@render nextButton()}
			{:else}
				<p class="m-0 self-stretch text-center text-[13px] leading-normal text-muted-foreground">
					{m['session.shoot.note']()}
				</p>
			{/if}
		</aside>
	</div>
</div>
