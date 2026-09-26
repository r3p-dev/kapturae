<script lang="ts">
	import { SIZES, type PrintSize } from '$lib/session/session'
	import { cn } from '$lib/utils'

	let { size, class: className }: { size: PrintSize; class?: string } = $props()

	function scaled(factor: number) {
		return `calc(var(--h) * ${factor})`
	}

	const spec = $derived(SIZES[size])
	const padding = $derived(`max(3px, ${scaled(spec.ratio * spec.padding)})`)
	const inset = $derived(`${padding} ${padding} ${scaled(spec.paddingBottom)}`)
</script>

<span
	aria-hidden="true"
	class={cn(
		'relative grid h-(--h) shrink-0 outline-[1.5px] outline-offset-0 outline-[#5e5c57] outline-dashed',
		className
	)}
	style:width={scaled(spec.ratio)}
	style:padding={inset}
	style:gap="max(2px, calc({padding} * 0.7))"
	style:grid-template-columns={spec.columns}
	style:grid-template-rows={spec.rows}
>
	{#each spec.slots as area, index (index)}
		<span class="min-h-0 min-w-0 bg-[#262624]" style:grid-area={area}></span>
	{/each}
</span>
