<script lang="ts">
	import RiSipLine from 'remixicon-svelte/icons/sip-line'
	import { m } from '$lib/paraglide/messages'
	import { cn } from '$lib/utils'
	import { swatch } from './styles'

	let {
		value,
		isActive,
		set,
		oncommit
	}: { value: string; isActive: boolean; set: (hex: string) => void; oncommit: () => void } = $props()

	const RAINBOW = 'conic-gradient(from 90deg, #e8483a, #e8b23a, #5fbf4a, #1f9fbf, #5a4fcf, #c84fb0, #e8483a)'
</script>

<label
	class={cn(
		swatch,
		'relative flex cursor-pointer items-center justify-center outline-primary has-focus-visible:outline-2',
		isActive && 'outline-2 outline-paper'
	)}
	style:background={isActive ? value : RAINBOW}
>
	<RiSipLine aria-hidden="true" class="size-4 text-white mix-blend-difference" />

	<input
		type="color"
		aria-label={m['session.edit.swatches.custom']()}
		{value}
		oninput={(event) => set(event.currentTarget.value)}
		onchange={oncommit}
		class="absolute inset-0 size-full cursor-pointer opacity-0"
	/>
</label>
