<script lang="ts">
	import type { Snippet } from 'svelte'
	import ShutterButton, { type ShutterSize } from '$lib/components/atoms/shutter-button.svelte'
	import { cn } from '$lib/utils'

	let {
		href,
		size,
		label,
		status,
		isBusy = false,
		isStatusHidden = false,
		onclick,
		children,
		class: className
	}: {
		href?: string
		size?: ShutterSize
		label: string
		status: string
		isBusy?: boolean
		isStatusHidden?: boolean
		onclick?: (event: MouseEvent) => void
		children?: Snippet
		class?: string
	} = $props()
</script>

<div class={cn('flex flex-col items-center gap-3', className)}>
	<ShutterButton {href} {size} {onclick} aria-label={label} aria-disabled={isBusy}>
		{@render children?.()}
	</ShutterButton>

	<span
		aria-live="polite"
		class={cn('font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase', isStatusHidden && 'sr-only')}
	>
		{status}
	</span>
</div>
