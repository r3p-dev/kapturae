<script lang="ts">
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import AdjustPanel from './adjust-panel.svelte'
	import BrushPanel from './brush-panel.svelte'
	import ColorPanel from './color-panel.svelte'
	import FilterPanel from './filter-panel.svelte'
	import ReplacePanel from './replace-panel.svelte'
	import StickerPanel from './sticker-panel.svelte'
	import { edge } from './styles'
	import TextPanel from './text-panel.svelte'

	let { editor }: { editor: EditState } = $props()
</script>

<aside
	class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto border-t {edge} p-4 rail:w-72 rail:flex-none rail:gap-4.5 rail:border-t-0 rail:border-l rail:p-6 desktop:w-80"
>
	{#if editor.isReplacingSlot && editor.slot !== null}
		<ReplacePanel {editor} slot={editor.slot} />
	{:else if editor.tool === 'color'}
		<ColorPanel {editor} />
	{:else if editor.tool === 'adjust'}
		<AdjustPanel {editor} />
	{:else if editor.tool === 'filter'}
		<FilterPanel {editor} />
	{:else if editor.tool === 'sticker'}
		<StickerPanel {editor} />
	{:else if editor.tool === 'text'}
		<TextPanel {editor} />
	{:else if editor.tool === 'brush'}
		<BrushPanel {editor} />
	{/if}
</aside>
