<script lang="ts">
	import { onMount } from 'svelte'
	import { asset } from '$app/paths'
	import Corners from '$lib/components/atoms/corners.svelte'
	import CameraFeed from '$lib/components/atoms/camera-feed.svelte'
	import Countdown from '$lib/components/atoms/countdown.svelte'
	import Flash from '$lib/components/atoms/flash.svelte'
	import ShutterButton from '$lib/components/atoms/shutter-button.svelte'
	import CameraStatus from '$lib/components/molecules/camera-status.svelte'
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import { BurstRecorder } from '$lib/burst'
	import { Camera, TIMERS } from '$lib/camera.svelte'
	import { m } from '$lib/paraglide/messages'

	let { label, onshot }: { label: string; onshot: (url: string, burst: string[]) => void } = $props()

	const TICK_MS = 1000
	const FLASH_MS = 700

	const camera = new Camera()
	const burst = new BurstRecorder()

	let video = $state<HTMLVideoElement>()
	let timer = $state<number>(TIMERS[0])
	let phase = $state<number | 'flash' | null>(null)
	let sound: HTMLAudioElement | undefined
	let alive = true

	const ready = $derived(camera.status === 'live' && phase === null)
	const wait = (ms: number) => new Promise<boolean>((resolve) => setTimeout(() => resolve(alive), ms))

	async function shoot() {
		if (!ready || !video) return
		burst.start(video, camera.mirrored)

		for (let n = timer; n > 0; n--) {
			phase = n
			if (!(await wait(TICK_MS))) return burst.cancel()
		}

		if (camera.status !== 'live') {
			burst.cancel()
			phase = null
			return
		}

		phase = 'flash'
		if (sound) {
			sound.currentTime = 0
			sound.play().catch(() => {})
		}

		try {
			burst.grab()
			const frames = burst.stop()
			const url = await camera.capture(video)
			if (alive) onshot(url, frames)
			else URL.revokeObjectURL(url)
		} catch {
			burst.cancel()
		}

		if (await wait(FLASH_MS)) phase = null
	}

	onMount(() => {
		sound = new Audio(asset('/shutter.mp3'))
		camera.start()

		return () => {
			alive = false
			burst.cancel()
			camera.stop()
		}
	})
</script>

<div class="relative h-51 shrink-0 overflow-hidden bg-[#232321]">
	{#if camera.status === 'live'}
		<CameraFeed stream={camera.stream} mirrored={camera.mirrored} bind:video />
		<span class="absolute top-4 left-10 flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] uppercase">
			<span aria-hidden="true" class="size-1.75 animate-rec-blink rounded-full bg-primary motion-reduce:animate-none"
			></span>
			{m['session.shoot.live']()}
		</span>
	{:else}
		<CameraStatus
			status={camera.status}
			onretry={() => camera.start()}
			class="absolute inset-0 gap-2 p-3 [&_h2]:text-base [&_p]:text-xs"
		/>
	{/if}

	<Corners inset="10px" size="20px" weight="2px" class="text-paper" />

	{#if typeof phase === 'number'}
		<Countdown value={phase} class="absolute bg-ink/40" digitClass="text-[96px] text-paper" />
	{:else if phase === 'flash'}
		<Flash class="absolute" />
	{/if}
</div>

<div class="flex items-center justify-between gap-3">
	<ToggleGroup.Root
		type="single"
		spacing={2}
		aria-label={m['session.shoot.timer_label']()}
		disabled={phase !== null}
		bind:value={() => String(timer), (next) => next && (timer = Number(next))}
	>
		{#each TIMERS as t (t)}
			<ToggleGroup.Item
				value={String(t)}
				class="h-11 min-w-12 border-[1.5px] border-paper px-2 font-mono text-xs font-normal normal-case data-[state=on]:bg-paper data-[state=on]:text-ink"
			>
				{t}s
			</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>

	<ShutterButton
		onclick={shoot}
		aria-label={label}
		aria-disabled={!ready}
		class="size-18 border-3 aria-disabled:opacity-50 [&>span]:size-13"
	/>
</div>
