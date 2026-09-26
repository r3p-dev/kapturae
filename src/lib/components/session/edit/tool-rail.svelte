<script lang="ts">
	import RiBrushLine from 'remixicon-svelte/icons/brush-line'
	import RiContrastDropLine from 'remixicon-svelte/icons/contrast-drop-line'
	import RiEmotionHappyLine from 'remixicon-svelte/icons/emotion-happy-line'
	import RiEqualizerLine from 'remixicon-svelte/icons/equalizer-line'
	import RiPaletteLine from 'remixicon-svelte/icons/palette-line'
	import RiText from 'remixicon-svelte/icons/text'
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import type { Tool } from '$lib/editor/editor.svelte'
	import { m } from '$lib/paraglide/messages'
	import { edge } from './styles'

	let { editor }: { editor: EditState } = $props()

	const tools = [
		{ value: 'adjust', icon: RiEqualizerLine, label: m['session.edit.tools.adjust'] },
		{ value: 'filter', icon: RiContrastDropLine, label: m['session.edit.tools.filter'] },
		{ value: 'sticker', icon: RiEmotionHappyLine, label: m['session.edit.tools.sticker'] },
		{ value: 'text', icon: RiText, label: m['session.edit.tools.text'] },
		{ value: 'brush', icon: RiBrushLine, label: m['session.edit.tools.brush'] },
		{
			value: 'color',
			icon: RiPaletteLine,
			label: m['session.edit.tools.color'],
			short: m['session.edit.tools.color_short']
		}
	] as const
</script>

<ToggleGroup.Root
	type="single"
	orientation="vertical"
	rovingFocus={false}
	spacing={1}
	aria-label={m['session.edit.tools_label']()}
	bind:value={() => editor.tool ?? '', (next) => editor.pickTool((next || null) as Tool | null)}
	class="order-last h-19 w-full shrink-0 flex-row! items-center! justify-around border-t {edge} px-1 pb-2 rail:order-first rail:h-auto rail:w-24 rail:flex-col! rail:justify-start rail:gap-1.5 rail:border-t-0 rail:border-r rail:px-0 rail:pt-4 rail:pb-0"
>
	{#each tools as toolOption (toolOption.value)}
		<ToggleGroup.Item
			value={toolOption.value}
			class="h-14.5 w-14.5 flex-col gap-1 px-0 font-mono text-[9px] font-normal tracking-[0.04em] text-body hover:bg-[#232321] data-[state=on]:bg-[#232321] data-[state=on]:text-primary-text rail:h-16 rail:w-20 rail:text-[10px] rail:tracking-[0.06em]"
		>
			<toolOption.icon aria-hidden="true" class="size-5" />
			{#if 'short' in toolOption}
				<span class="rail:hidden">{toolOption.short()}</span>
				<span class="hidden rail:inline">{toolOption.label()}</span>
			{:else}
				{toolOption.label()}
			{/if}
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>
