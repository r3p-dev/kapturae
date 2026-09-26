<script lang="ts">
	import type { Pathname } from '$app/types'
	import { onDestroy, type Snippet } from 'svelte'
	import { goto, preloadData } from '$app/navigation'
	import { resolve } from '$app/paths'
	import type { ShutterSize } from '$lib/components/atoms/shutter-button.svelte'
	import Countdown from '$lib/components/atoms/countdown.svelte'
	import Flash from '$lib/components/atoms/flash.svelte'
	import ShutterRelease from '$lib/components/molecules/shutter-release.svelte'
	import { m } from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { FRAME_ASSETS } from '$lib/frames/frames'

	let {
		size,
		label,
		idle = '',
		isStatusHidden,
		children,
		class: className
	}: {
		size?: ShutterSize
		label: string
		idle?: string
		isStatusHidden?: boolean
		children?: Snippet
		class?: string
	} = $props()

	type Phase = 'loading' | 3 | 2 | 1 | 'flash' | null

	const STEP_MS = 700
	const JUMP_MS = 150

	const session = resolve(localizeHref('/session/frame') as Pathname)

	let phase = $state<Phase>(null)
	let timers: ReturnType<typeof setTimeout>[] = []
	let isDestroyed = false

	const status = $derived(
		phase === null ? idle : phase === 'loading' ? m['common.shutter.loading']() : m['common.shutter.busy']()
	)

	function preloadImage(src: string) {
		const image = new Image()
		image.src = src
		return image.decode()
	}

	async function shoot(event: MouseEvent) {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return
		}

		event.preventDefault()

		if (phase !== null) {
			return
		}
		phase = 'loading'

		try {
			await Promise.all([preloadData(session), ...FRAME_ASSETS.map(preloadImage)])
		} catch {
			phase = null
			return
		}

		if (isDestroyed) {
			return
		}

		const sequence: Phase[] = [3, 2, 1, 'flash']
		timers = sequence.map((next, index) => setTimeout(() => (phase = next), index * STEP_MS))
		timers.push(setTimeout(() => goto(session), (sequence.length - 1) * STEP_MS + JUMP_MS))
	}

	onDestroy(() => {
		isDestroyed = true
		for (const timer of timers) {
			clearTimeout(timer)
		}
	})
</script>

<ShutterRelease
	href={session}
	{size}
	{label}
	{status}
	{isStatusHidden}
	isBusy={phase !== null}
	onclick={shoot}
	class={className}
>
	{@render children?.()}
</ShutterRelease>

{#if typeof phase === 'number'}
	<Countdown value={phase} />
{:else if phase === 'flash'}
	<Flash />
{/if}
