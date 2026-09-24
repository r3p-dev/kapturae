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

	let isOver = $state(false)
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	data-over={isOver ? '' : undefined}
	ondragenter={(event) => {
		event.preventDefault()
		isOver = !disabled
	}}
	ondragover={(event) => event.preventDefault()}
	ondragleave={(event) => {
		if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
			isOver = false
		}
	}}
	ondrop={(event) => {
		event.preventDefault()
		isOver = false
		if (!disabled) {
			onfiles(droppedFiles(event))
		}
	}}
	class={cn('transition-colors data-over:border-primary data-over:bg-primary/8', className)}
>
	{@render children()}
</div>
