<script lang="ts">
	import { cn } from '$lib/utils'

	let { class: className }: { class?: string } = $props()
</script>

<div
	aria-hidden="true"
	class={cn(
		'pointer-events-none fixed inset-0 z-50 animate-shutter-flash bg-white motion-reduce:animate-none motion-reduce:opacity-90',
		className
	)}
></div>
