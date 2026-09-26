<script lang="ts">
	import type { Snippet } from 'svelte'
	import { SIZES, type Frame } from '$lib/session/session'
	import { cn } from '$lib/utils'

	let {
		frame,
		photo,
		class: className
	}: {
		frame: Frame
		photo?: Snippet<[index: number]>
		class?: string
	} = $props()
</script>

<span
	aria-hidden="true"
	class={cn('relative block h-(--h) shrink-0 ring-1 ring-paper/14', className)}
	style:width="calc(var(--h) * {SIZES[frame.size].ratio})"
>
	{#each frame.slots as slot, index (index)}
		<span
			class="absolute overflow-hidden bg-[#5e5c57]"
			style:left="{slot.x}%"
			style:top="{slot.y}%"
			style:width="{slot.width}%"
			style:height="{slot.height}%"
		>
			{@render photo?.(index)}
		</span>
	{/each}

	<img src={frame.src} alt="" loading="lazy" draggable="false" class="pointer-events-none absolute inset-0 size-full" />
</span>
