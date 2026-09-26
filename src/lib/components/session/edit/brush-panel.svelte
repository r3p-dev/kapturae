<script lang="ts">
	import RiEraserLine from 'remixicon-svelte/icons/eraser-line'
	import { Button } from '$lib/components/ui/button'
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import PanelHead from './panel-head.svelte'
	import RangeField from './range-field.svelte'
	import { outline } from './styles'
	import SwatchPicker from './swatch-picker.svelte'

	let { editor }: { editor: EditState } = $props()

	const brush = $derived(editor.brush)
</script>

<PanelHead title={m['session.edit.brush_title']()} onclose={() => editor.pickTool(null)} />

<RangeField
	label={m['session.edit.size']()}
	display="{brush.size} px"
	value={brush.size}
	set={(next) => (brush.size = next)}
	oncommit={() => editor.commit()}
	options={{ min: 1, max: 40 }}
/>

<SwatchPicker
	label={m['session.edit.color_label']()}
	value={brush.color}
	set={(hex) => {
		brush.color = hex
		brush.isEraser = false
	}}
	oncommit={() => editor.commit()}
/>

<Button
	variant="outline"
	aria-pressed={brush.isEraser}
	onclick={() => (brush.isEraser = !brush.isEraser)}
	class="{outline} aria-pressed:border-paper aria-pressed:bg-paper aria-pressed:text-ink"
>
	<RiEraserLine aria-hidden="true" class="size-4" />
	{m['session.edit.eraser']()}
</Button>
