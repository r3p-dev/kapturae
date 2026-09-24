<script lang="ts">
	import { SIZES, type PrintSize } from '$lib/session'
	import { cn } from '$lib/utils'

	let { size, class: className }: { size: PrintSize; class?: string } = $props()

	const h = (k: number) => `calc(var(--h) * ${k})`

	const s = $derived(SIZES[size])
	const pad = $derived(`max(3px, ${h(s.ratio * s.pad)})`)
	const inset = $derived(`${pad} ${pad} ${h(s.padBottom)}`)
</script>

<span
	aria-hidden="true"
	class={cn(
		'relative grid h-(--h) shrink-0 outline-[1.5px] outline-offset-0 outline-[#5e5c57] outline-dashed',
		className
	)}
	style:width={h(s.ratio)}
	style:padding={inset}
	style:gap="max(2px, calc({pad} * 0.7))"
	style:grid-template-columns={s.cols}
	style:grid-template-rows={s.rows}
>
	{#each s.slots as area, i (i)}
		<span class="min-h-0 min-w-0 bg-[#262624]" style:grid-area={area}></span>
	{/each}
</span>
