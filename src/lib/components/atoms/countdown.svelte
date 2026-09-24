<script lang="ts">
	let { value }: { value: number } = $props()
</script>

<div
	aria-hidden="true"
	class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-ink/72"
>
	<span
		class="font-display text-[clamp(10rem,26vw,23.75rem)] leading-none font-black text-primary font-stretch-125%"
	>
		{value}
	</span>
</div>
