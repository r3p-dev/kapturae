<script lang="ts">
	import RiAddLine from 'remixicon-svelte/icons/add-line'
	import RiRestartLine from 'remixicon-svelte/icons/restart-line'
	import RiSubtractLine from 'remixicon-svelte/icons/subtract-line'
	import { Button } from '$lib/components/ui/button'
	import { ZOOM_BUTTON_STEP, type EditState } from '$lib/editor/edit-state.svelte'
	import { ZOOM, type SlotEdit } from '$lib/editor/editor.svelte'
	import { m } from '$lib/paraglide/messages'
	import { square } from './styles'

	let { editor, current }: { editor: EditState; current: SlotEdit } = $props()
</script>

<div class="absolute top-1/2 right-3.5 z-10 flex flex-col items-end gap-2 desktop:hidden">
	{#if editor.hasPhoto}
		<div class="flex items-center gap-1.5">
			<button
				type="button"
				onclick={() => editor.zoomBy(-ZOOM_BUTTON_STEP)}
				disabled={current.zoom <= ZOOM.min}
				aria-label={m['session.edit.zoom_out']()}
				class="{square} hidden rail:flex"
			>
				<RiSubtractLine aria-hidden="true" class="size-4" />
			</button>

			<span class="bg-paper px-2 py-1.25 font-mono text-[11px] text-ink">
				{m['session.edit.zoom_value']({ n: current.zoom })}
			</span>

			<button
				type="button"
				onclick={() => editor.zoomBy(ZOOM_BUTTON_STEP)}
				disabled={current.zoom >= ZOOM.max}
				aria-label={m['session.edit.zoom_in']()}
				class="{square} hidden rail:flex"
			>
				<RiAddLine aria-hidden="true" class="size-4" />
			</button>
		</div>
	{/if}

	<Button
		onclick={() => editor.openSheet()}
		class="h-11 gap-1.5 bg-paper px-3 font-mono text-[11px] font-medium text-ink hover:bg-paper-2"
	>
		<RiRestartLine aria-hidden="true" class="size-3.5 text-primary" />
		{editor.hasPhoto ? m['session.replace.short']() : m['session.edit.take']()}
	</Button>
</div>
