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
</script>

<div class={cn('flex flex-col items-center gap-4.5 text-center', className)}>
	<p class="flex items-center gap-3 font-mono text-[13px] tracking-[0.16em] uppercase">
		<span aria-hidden="true" class="h-4 w-2 border-2 border-r-0 border-current"></span>
		FRAME {String(frame).padStart(2, '0')} / 06 · {label}
		<span aria-hidden="true" class="h-4 w-2 border-2 border-l-0 border-current"></span>
	</p>

	<h2
		class={cn(
			'm-0 font-display text-5xl leading-[0.92] font-black text-balance uppercase font-stretch-118% tablet:text-6xl rail:text-[80px]',
			titleClass
		)}
	>
		{#each lines as line, i (i)}{#if i > 0}<br />{/if}{line}{/each}
		{#if accent}<span class="text-primary">{accent}</span>{/if}
	</h2>

	{#if description}
		<p class="m-0 max-w-2xl text-lg leading-normal text-body">{description}</p>
	{/if}
</div>
