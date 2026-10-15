<script lang="ts" module>
	export const FRAME_COUNT = 7

	const DISPLAY_EM_PER_CHAR = 0.9
</script>

<script lang="ts">
	import { cn } from '$lib/utils'

	let {
		frame,
		label,
		title,
		accent,
		description,
		titleClass,
		class: className
	}: {
		frame: number
		label: string
		title: string | string[]
		accent?: string
		description?: string
		titleClass?: string
		class?: string
	} = $props()

	const lines = $derived(Array.isArray(title) ? title : [title])

	const longestWord = $derived(
		Math.max(...[...lines, accent ?? ''].flatMap((line) => line.split(/\s+/)).map((word) => word.length))
	)
</script>

<div class={cn('@container flex w-full flex-col items-center gap-4.5 text-center', className)}>
	<p class="flex items-center gap-3 font-mono text-[13px] tracking-[0.16em] uppercase">
		<span aria-hidden="true" class="h-4 w-2 border-2 border-r-0 border-current"></span>
		FRAME {String(frame).padStart(2, '0')} / {String(FRAME_COUNT).padStart(2, '0')} · {label}
		<span aria-hidden="true" class="h-4 w-2 border-2 border-l-0 border-current"></span>
	</p>

	<h2
		style:--title-fit={longestWord * DISPLAY_EM_PER_CHAR}
		class={cn(
			'm-0 font-display text-[min(var(--title-size),100cqi/var(--title-fit))] leading-[0.92] font-black text-balance uppercase font-stretch-118% [--title-size:3rem] tablet:[--title-size:3.75rem] rail:[--title-size:80px]',
			titleClass
		)}
	>
		{#each lines as line, index (index)}{#if index > 0}<br />{/if}{line}{/each}
		{#if accent}<span class="text-primary">{accent}</span>{/if}
	</h2>

	{#if description}
		<p class="m-0 max-w-2xl text-lg leading-normal text-body">{description}</p>
	{/if}
</div>
