<script lang="ts">
	import RiAddLine from 'remixicon-svelte/icons/add-line'
	import { Button } from '$lib/components/ui/button'
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import { FONTS, ITEM_SIZE, type Font } from '$lib/editor/editor.svelte'
	import { m } from '$lib/paraglide/messages'
	import PanelHead from './panel-head.svelte'
	import RangeField from './range-field.svelte'
	import RemoveItem from './remove-item.svelte'
	import SwatchPicker from './swatch-picker.svelte'

	let { editor }: { editor: EditState } = $props()

	const text = $derived(editor.text)
	const draft = $derived(editor.draft)

	const fontLabels = {
		bold: m['session.edit.fonts.bold'],
		mono: m['session.edit.fonts.mono'],
		serif: m['session.edit.fonts.serif']
	}
	const fontClass = {
		bold: 'font-display font-extrabold text-sm',
		mono: 'font-mono',
		serif: 'font-serif italic text-[15px]'
	}
</script>

<PanelHead title={m['session.edit.text_title']()} onclose={() => editor.pickTool(null)} />

<div class="flex flex-col gap-2">
	<label for="edit-text" class="text-[13px] text-body">{m['session.edit.text_label']()}</label>
	<input
		id="edit-text"
		type="text"
		maxlength="40"
		placeholder={m['session.edit.text_placeholder']()}
		value={text ? text.text : draft.text}
		oninput={(event) => {
			if (text) {
				text.text = event.currentTarget.value
			} else {
				draft.text = event.currentTarget.value
			}
		}}
		onchange={() => editor.commit()}
		onkeydown={(event) => event.key === 'Enter' && !text && editor.addText()}
		class="h-11 border border-[#3a3936] bg-card px-3 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-none"
	/>
</div>

<ToggleGroup.Root
	type="single"
	spacing={2}
	aria-label={m['session.edit.fonts_label']()}
	bind:value={
		() => text?.font ?? draft.font,
		(next) => {
			if (!next) {
				return
			}
			editor.setTextStyle({ font: next as Font })
			editor.commit()
		}
	}
	class="grid w-full grid-cols-3 gap-2"
>
	{#each FONTS as font (font)}
		<ToggleGroup.Item
			value={font}
			class="h-11 border border-[#3a3936] px-0 font-normal tracking-normal normal-case data-[state=on]:border-paper data-[state=on]:bg-paper data-[state=on]:text-ink {fontClass[
				font
			]}"
		>
			{fontLabels[font]()}
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>

<SwatchPicker
	label={m['session.edit.color_label']()}
	value={text?.color ?? draft.color}
	set={(hex) => editor.setTextStyle({ color: hex })}
	oncommit={() => editor.commit()}
/>

{#if text}
	<RangeField
		label={m['session.edit.size']()}
		display="{text.size}%"
		value={text.size}
		set={(next) => (text.size = next)}
		oncommit={() => editor.commit()}
		options={ITEM_SIZE.text}
	/>
	<RemoveItem {editor} />
{:else}
	<Button onclick={() => editor.addText()} class="h-11 gap-2 font-mono font-medium">
		<RiAddLine aria-hidden="true" class="size-4" />
		{m['session.edit.text_add']()}
	</Button>
{/if}
