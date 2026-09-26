<script lang="ts">
	import RiArrowLeftLine from 'remixicon-svelte/icons/arrow-left-line'
	import RiCameraSwitchLine from 'remixicon-svelte/icons/camera-switch-line'
	import type { ShootState } from '$lib/capture/shoot-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import { shots } from '$lib/session/shots.svelte'
	import { cn } from '$lib/utils'
	import { mono, pill } from './styles'

	let { shooter }: { shooter: ShootState } = $props()
</script>

<div class="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center px-2 rail:hidden">
	<a
		href={shooter.back}
		aria-label={shooter.retake === null ? m['session.shoot.back']() : m['session.shoot.back_editor']()}
		class={pill}
	>
		<RiArrowLeftLine aria-hidden="true" class="size-5" />
	</a>

	<span class="{mono} bg-ink/55 px-2.5 py-1.5 text-xs text-paper">
		{m['session.shoot.shot_hud']({ n: shooter.current, total: shooter.total })}
	</span>

	{#if shooter.camera.canFlip && shooter.source === 'camera'}
		<button
			type="button"
			onclick={() => shooter.camera.flip()}
			disabled={shooter.isBusy}
			aria-label={m['session.shoot.flip']()}
			class={cn(pill, 'justify-self-end disabled:opacity-50')}
		>
			<RiCameraSwitchLine aria-hidden="true" class="size-5" />
		</button>
	{/if}
</div>

<div aria-hidden="true" class="mt-1 flex justify-center gap-1.5 rail:hidden">
	{#each { length: shooter.total }, index (index)}
		<span
			class="h-1 w-10"
			style:background-color={shooter.shotAt(index) === shooter.target && !shooter.isComplete
				? 'var(--primary)'
				: `color-mix(in srgb, ${shooter.frame.ink} ${shots.photos[shooter.shotAt(index)] ? 100 : 30}%, transparent)`}
		></span>
	{/each}
</div>
