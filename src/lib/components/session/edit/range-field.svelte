<script lang="ts">
	import { Slider } from '$lib/components/ui/slider'

	let {
		label,
		display,
		value,
		set,
		oncommit,
		options
	}: {
		label: string
		display: string
		value: number
		set: (next: number) => void
		oncommit: () => void
		options: { min: number; max: number; step?: number; disabled?: boolean }
	} = $props()
</script>

<div class="flex flex-col gap-2.5">
	<div class="flex justify-between text-[13px]">
		<span>{label}</span>
		<span class="font-mono text-muted-foreground">{display}</span>
	</div>

	<Slider
		type="single"
		{value}
		onValueChange={set}
		onValueCommit={oncommit}
		min={options.min}
		max={options.max}
		step={options.step ?? 1}
		disabled={options.disabled}
		aria-label={label}
	/>
</div>
