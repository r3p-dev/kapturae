<script lang="ts">
	import type { Snippet } from 'svelte'
	import { droppedFiles } from '$lib/upload'
	import { cn } from '$lib/utils'

	let {
		onfiles,
		disabled = false,
		class: className,
		children
	}: { onfiles: (files: File[]) => void; disabled?: boolean; class?: string; children: Snippet } = $props()

	let over = $state(false)
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	data-over={over ? '' : undefined}
	ondragenter={(e) => {
		e.preventDefault()
		over = !disabled
	}}
	ondragover={(e) => e.preventDefault()}
	ondragleave={(e) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node | null)) over = false
	}}
	ondrop={(e) => {
		e.preventDefault()
		over = false
		if (!disabled) onfiles(droppedFiles(e))
	}}
	class={cn('transition-colors data-over:border-primary data-over:bg-primary/8', className)}
>
	{@render children()}
</div>
