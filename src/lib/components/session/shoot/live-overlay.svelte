<script lang="ts">
	import Corners from '$lib/components/atoms/corners.svelte'
	import type { ShootState } from '$lib/capture/shoot-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import { mono } from './styles'

	let { shooter }: { shooter: ShootState } = $props()
</script>

<div aria-hidden="true" class="pointer-events-none absolute inset-0 hidden rail:block">
	<span class="absolute inset-y-0 left-1/3 w-px bg-paper/10"></span>
	<span class="absolute inset-y-0 left-2/3 w-px bg-paper/10"></span>
	<span class="absolute inset-x-0 top-1/3 h-px bg-paper/10"></span>
	<span class="absolute inset-x-0 top-2/3 h-px bg-paper/10"></span>
</div>

<Corners inset="24px" size="44px" weight="3px" class="hidden text-paper rail:block" />

{#if shooter.camera.status === 'live'}
	<div class="{mono} absolute inset-x-22 top-10 hidden items-center justify-between text-[13px] text-paper rail:flex">
		<span class="flex items-center gap-2">
			<span aria-hidden="true" class="size-2.5 animate-rec-blink rounded-full bg-primary motion-reduce:animate-none"
			></span>
			{m['session.shoot.live']()}
		</span>

		<span>{shooter.hud}</span>
	</div>

	<span
		class="{mono} absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 bg-ink/55 px-2.5 py-1.5 text-xs text-paper rail:hidden"
	>
		<span aria-hidden="true" class="size-1.75 animate-rec-blink rounded-full bg-primary motion-reduce:animate-none"
		></span>
		{m['session.shoot.live']()}
	</span>
{/if}
