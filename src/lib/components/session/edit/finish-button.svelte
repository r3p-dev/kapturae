<script lang="ts">
	import RiArrowRightLine from 'remixicon-svelte/icons/arrow-right-line'
	import { Button } from '$lib/components/ui/button'
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import { cn } from '$lib/utils'

	let {
		editor,
		hasArrow = true,
		class: className
	}: { editor: EditState; hasArrow?: boolean; class?: string } = $props()
</script>

<Button
	href={editor.done}
	disabled={editor.isMissingPhotos}
	class={cn('h-11 gap-2.5 font-mono font-medium aria-disabled:pointer-events-none aria-disabled:opacity-40', className)}
>
	{m['session.edit.done']()}
	{#if hasArrow}<RiArrowRightLine aria-hidden="true" class="size-4" />{/if}
</Button>
