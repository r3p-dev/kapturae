<script lang="ts">
	import { cn } from '$lib/utils'

	let {
		inset = '0px',
		size = '56px',
		weight = '3px',
		class: className
	}: {
		inset?: string
		size?: string
		weight?: string
		class?: string
	} = $props()

	const corner = 'absolute size-(--c-size) border-current'
</script>

<div
	aria-hidden="true"
	class={cn('pointer-events-none absolute', className)}
	style:inset
	style:--c-size={size}
	style:--c-w={weight}
>
	<span class={cn(corner, 'top-0 left-0 border-t-(length:--c-w) border-l-(length:--c-w)')}></span>
	<span class={cn(corner, 'top-0 right-0 border-t-(length:--c-w) border-r-(length:--c-w)')}></span>
	<span class={cn(corner, 'bottom-0 left-0 border-b-(length:--c-w) border-l-(length:--c-w)')}></span>
	<span class={cn(corner, 'right-0 bottom-0 border-r-(length:--c-w) border-b-(length:--c-w)')}></span>
</div>
