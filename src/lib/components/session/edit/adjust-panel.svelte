<script lang="ts">
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import ApplyAll from './apply-all.svelte'
	import PanelHead from './panel-head.svelte'
	import RangeField from './range-field.svelte'

	let { editor }: { editor: EditState } = $props()

	const adjustments = [
		{ key: 'brightness', label: m['session.edit.brightness'], min: -100 },
		{ key: 'contrast', label: m['session.edit.contrast'], min: -100 },
		{ key: 'saturation', label: m['session.edit.saturation'], min: -100 },
		{ key: 'warmth', label: m['session.edit.warmth'], min: -100 },
		{ key: 'grain', label: m['session.edit.grain'], min: 0 }
	] as const

	function signed(value: number, min: number) {
		return min < 0 && value > 0 ? `+${value}` : String(value)
	}
</script>

{#if editor.slot === null || !editor.current}
	<PanelHead title={m['session.edit.tools.adjust']()} onclose={() => editor.pickTool(null)} />

	<p class="m-0 text-[13px] leading-normal text-muted-foreground">{m['session.edit.select_slot']()}</p>
{:else}
	{@const adjusting = editor.current}

	<PanelHead title={m['session.edit.adjust_title']({ n: editor.slot + 1 })} onclose={() => editor.pickTool(null)} />

	{#each adjustments as adjustment (adjustment.key)}
		<RangeField
			label={adjustment.label()}
			display={signed(adjusting[adjustment.key], adjustment.min)}
			value={adjusting[adjustment.key]}
			set={(next) => editor.setAdjustment(adjustment.key, next)}
			oncommit={() => editor.commit()}
			options={{ min: adjustment.min, max: 100, disabled: !editor.hasPhoto }}
		/>
	{/each}
{/if}

<ApplyAll {editor} />
