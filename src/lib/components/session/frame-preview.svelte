<script lang="ts">
	import { m } from '$lib/paraglide/messages'
	import { DESIGNS, SIZES, type FrameDesign, type PrintSize } from '$lib/session'
	import { cn } from '$lib/utils'

	let {
		design,
		size,
		class: className
	}: { design: FrameDesign; size: PrintSize; class?: string } = $props()

	const labels: Partial<Record<FrameDesign, () => string>> = {
		christmas: m['session.frames.christmas_label'],
		birthday: m['session.frames.birthday_label'],
		lines: m['session.frames.lines_label']
	}

	const h = (k: number) => `calc(var(--h) * ${k})`

	const d = $derived(DESIGNS[design])
	const s = $derived(SIZES[size])
	const label = $derived((labels[design] ?? m['common.brand'])())
	const pad = $derived(`max(3px, ${h(s.ratio * s.pad)})`)
	const inset = $derived(`${pad} ${pad} ${h(s.padBottom)}`)
</script>

<span
	aria-hidden="true"
	class={cn('relative grid h-(--h) shrink-0 ring-1 ring-paper/14', className)}
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
		<span style:grid-area={area} style:background-color={d.slot}></span>
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
