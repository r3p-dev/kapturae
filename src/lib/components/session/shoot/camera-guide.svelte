<script lang="ts">
	import type { ShootState } from '$lib/capture/shoot-state.svelte'
	import FramePreview from './frame-preview.svelte'

	let { shooter }: { shooter: ShootState } = $props()

	let guideWidth = $state(0)
	let guideHeight = $state(0)

	const view = $derived.by(() => {
		const slot = shooter.frame.slots[shooter.targetSlot] ?? { x: 0, y: 0, width: 100, height: 100 }
		const height = Math.min(guideWidth / ((slot.width / 100) * shooter.spec.ratio), guideHeight / (slot.height / 100))

		return {
			height,
			x: guideWidth / 2 - ((slot.x + slot.width / 2) / 100) * height * shooter.spec.ratio,
			y: guideHeight / 2 - ((slot.y + slot.height / 2) / 100) * height
		}
	})
</script>

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
			style:--h="{view.height}px"
		>
			<FramePreview {shooter} class="transition-[width,height] duration-700 ease-out motion-reduce:transition-none" />
		</div>
	{/if}
</div>
