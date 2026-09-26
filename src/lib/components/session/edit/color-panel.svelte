<script lang="ts">
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import { FRAME_COLORS } from '$lib/editor/editor.svelte'
	import { m } from '$lib/paraglide/messages'
	import CustomSwatch from './custom-swatch.svelte'
	import PanelHead from './panel-head.svelte'
	import { swatch } from './styles'

	let { editor }: { editor: EditState } = $props()

	const edit = $derived(editor.edit)

	const colors = $derived([
		{ key: 'original', hex: editor.frame.color, label: m['session.edit.colors.original'] },
		...(
			[
				['green', m['session.edit.colors.green']],
				['red', m['session.edit.colors.red']],
				['black', m['session.edit.colors.black']],
				['cream', m['session.edit.colors.cream']],
				['gold', m['session.edit.colors.gold']],
				['navy', m['session.edit.colors.navy']],
				['pink', m['session.edit.colors.pink']],
				['brown', m['session.edit.colors.brown']],
				['purple', m['session.edit.colors.purple']],
				['white', m['session.edit.colors.white']]
			] as const
		).map(([key, label]) => ({ key, hex: FRAME_COLORS[key], label }))
	])
</script>

<PanelHead
	title={m['session.edit.frame_title']()}
	note={m['session.edit.frame_note_short']()}
	onclose={() => editor.pickTool(null)}
/>

<p class="m-0 hidden text-sm leading-normal text-body rail:block">
	{m['session.edit.frame_note']({ name: editor.frame.name })}
</p>

<ToggleGroup.Root
	type="single"
	spacing={2}
	aria-label={m['session.edit.frame_title']()}
	bind:value={
		() => (edit.color ? (colors.find((option) => option.hex === edit.color)?.key ?? '') : 'original'),
		(next) => {
			if (!next) {
				return
			}
			edit.color = next === 'original' ? null : (colors.find((option) => option.key === next)?.hex ?? null)
			editor.commit()
		}
	}
	class="grid w-full grid-cols-6 gap-2 rail:gap-2.5"
>
	{#each colors as colorOption (colorOption.key)}
		<ToggleGroup.Item
			value={colorOption.key}
			aria-label={colorOption.label()}
			class={swatch}
			style="background-color: {colorOption.hex}"
		/>
	{/each}

	<CustomSwatch
		value={edit.color ?? editor.frame.color}
		isActive={edit.color !== null && !colors.some((option) => option.hex === edit.color)}
		set={(hex) => (edit.color = hex)}
		oncommit={() => editor.commit()}
	/>
</ToggleGroup.Root>

<div class="flex justify-between text-[13px] text-body">
	<span>{m['session.edit.ink']()}</span>
	<span class="font-mono text-muted-foreground uppercase">{m['session.edit.ink_auto']()}</span>
</div>
