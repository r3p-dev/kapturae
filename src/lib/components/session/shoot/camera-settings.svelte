<script lang="ts">
	import RiCameraSwitchLine from 'remixicon-svelte/icons/camera-switch-line'
	import RiTimerLine from 'remixicon-svelte/icons/timer-line'
	import type { ShootState } from '$lib/capture/shoot-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import { tile } from './styles'
	import { cameraToggles } from './toggles'

	let { shooter }: { shooter: ShootState } = $props()

	const toggles = $derived(cameraToggles(shooter))
</script>

<div class="hidden flex-1 items-center gap-2 rail:flex">
	<button
		type="button"
		onclick={() => shooter.cycleTimer()}
		disabled={shooter.isBusy}
		aria-label={m['session.shoot.timer_cycle']({ n: shooter.timer })}
		class={tile}
	>
		<RiTimerLine aria-hidden="true" class="size-4.5" />
		{shooter.timer}s
	</button>

	{#each toggles as item (item.label)}
		<button
			type="button"
			onclick={item.flip}
			disabled={item.isLocked && shooter.isBusy}
			aria-pressed={item.isOn}
			aria-label={item.label}
			title={item.label}
			class={tile}
		>
			<item.icon aria-hidden="true" class="size-4.5" />
		</button>
	{/each}

	{#if shooter.camera.canFlip}
		<button
			type="button"
			onclick={() => shooter.camera.flip()}
			disabled={shooter.isBusy}
			aria-label={m['session.shoot.flip']()}
			title={m['session.shoot.flip']()}
			class={tile}
		>
			<RiCameraSwitchLine aria-hidden="true" class="size-4.5" />
		</button>
	{/if}
</div>
