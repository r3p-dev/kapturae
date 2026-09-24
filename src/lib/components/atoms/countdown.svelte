<script lang="ts">
	import { cn } from '$lib/utils'

	let {
		value,
		class: className,
		digitClass
	}: { value: number; class?: string; digitClass?: string } = $props()
</script>

<div
	aria-hidden="true"
	class={cn(
		'pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-ink/72',
		className
	)}
>
	<span
		class={cn(
			'font-display text-[clamp(10rem,26vw,23.75rem)] leading-none font-black text-primary font-stretch-125%',
			digitClass
		)}
	>
		{value}
	</span>
</div>
