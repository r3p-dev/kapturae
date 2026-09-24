<script lang="ts">
	import RiTimerLine from 'remixicon-svelte/icons/timer-line'
	import { cn } from '$lib/utils'

	let {
		value = $bindable(),
		options,
		label,
		disabled = false,
		class: className
	}: {
		value: number
		options: readonly number[]
		label: string
		disabled?: boolean
		class?: string
	} = $props()
</script>

<fieldset {disabled} class={cn('m-0 flex min-w-0 items-center gap-2', className)}>
	<legend class="sr-only">{label}</legend>
	<RiTimerLine aria-hidden="true" class="size-5 text-muted-foreground" />

	{#each options as seconds (seconds)}
		<label
			class="flex h-11 min-w-13 cursor-pointer items-center justify-center border-[1.5px] border-foreground px-2 font-mono text-[13px] has-checked:bg-foreground has-checked:text-background has-focus-visible:ring-2 has-focus-visible:ring-foreground has-focus-visible:ring-offset-2 has-disabled:cursor-default"
		>
			<input type="radio" name="timer" value={seconds} bind:group={value} class="sr-only" />
			{seconds}s
		</label>
	{/each}
</fieldset>
