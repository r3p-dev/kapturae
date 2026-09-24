<script lang="ts">
	import type { Snippet } from 'svelte'
	import { DESIGNS, SIZES, type DesignSpec, type FrameDesign, type PrintSize } from '$lib/session'
	import { frameLabel } from '$lib/session-messages'
	import { cn } from '$lib/utils'

	let {
		design,
		size,
		photo,
		class: className
	}: {
		design?: FrameDesign
		size: PrintSize
		photo?: Snippet<[index: number]>
		class?: string
	} = $props()

	const EMPTY: DesignSpec = { bg: 'transparent', slot: '#262624', ink: 'transparent' }

	const h = (k: number) => `calc(var(--h) * ${k})`

	const d = $derived(design ? DESIGNS[design] : EMPTY)
	const s = $derived(SIZES[size])
	const label = $derived(design ? frameLabel(design) : '')
	const pad = $derived(`max(3px, ${h(s.ratio * s.pad)})`)
	const inset = $derived(`${pad} ${pad} ${h(s.padBottom)}`)
</script>

<span
	aria-hidden="true"
	class={cn(
		'relative grid h-(--h) shrink-0',
		design
			? 'ring-1 ring-paper/14'
			: 'outline-[1.5px] outline-offset-0 outline-[#5e5c57] outline-dashed',
		className
	)}
	style:width={h(s.ratio)}
	style:padding={inset}
	style:gap="max(2px, calc({pad} * 0.7))"
	style:grid-template-columns={s.cols}
	style:grid-template-rows={s.rows}
	style:background-color={d.bg}
	style:background-image={d.pattern}
	style:background-size={d.patternSize}
>
	{#each s.slots as area, i (i)}
		<span
			class="relative min-h-0 min-w-0 overflow-hidden"
			style:grid-area={area}
			style:background-color={d.slot}
		>
			{@render photo?.(i)}
		</span>
	{/each}

	<span
		class="absolute inset-x-0 overflow-hidden text-center font-display font-extrabold tracking-[0.08em] whitespace-nowrap uppercase font-stretch-112%"
		style:bottom={h(s.padBottom * 0.3)}
		style:font-size="max(5px, {h(Math.min(s.ratio, 0.45) * 0.085)})"
		style:color={d.ink}
	>
		{label}
	</span>
</span>
