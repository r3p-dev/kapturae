<script lang="ts">
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import { FILTER_IDS, filterCss, filterTint, type FilterId } from '$lib/editor/editor.svelte'
	import { m } from '$lib/paraglide/messages'
	import ApplyAll from './apply-all.svelte'
	import PanelHead from './panel-head.svelte'
	import RangeField from './range-field.svelte'

	let { editor }: { editor: EditState } = $props()

	const filterLabels = {
		original: m['session.edit.filters.original'],
		mono: m['session.edit.filters.mono'],
		warm: m['session.edit.filters.warm'],
		film: m['session.edit.filters.film'],
		faded: m['session.edit.filters.faded'],
		punchy: m['session.edit.filters.punchy'],
		noir: m['session.edit.filters.noir'],
		golden: m['session.edit.filters.golden'],
		vintage: m['session.edit.filters.vintage'],
		dreamy: m['session.edit.filters.dreamy'],
		cool: m['session.edit.filters.cool'],
		vivid: m['session.edit.filters.vivid']
	}

	const look = $derived(editor.look)
	const filterTitle = $derived(
		editor.slot === null
			? m['session.edit.filter_title']()
			: m['session.edit.filter_title_slot']({ n: editor.slot + 1 })
	)
	const intensity = $derived(look?.intensity ?? 100)
</script>

<PanelHead title={filterTitle} onclose={() => editor.pickTool(null)} />

{#if editor.slot === null}
	<p class="m-0 text-[13px] leading-normal text-muted-foreground">
		{m['session.edit.filter_pick_slot']()}
	</p>
{/if}

<ToggleGroup.Root
	type="single"
	spacing={2}
	aria-label={filterTitle}
	bind:value={
		() => look?.filter ?? '',
		(next) => {
			if (!next) {
				return
			}
			editor.setLook('filter', next as FilterId)
			editor.commit()
		}
	}
	class="grid w-full grid-cols-4 gap-2 rail:grid-cols-3 rail:gap-2.5"
>
	{#each FILTER_IDS as id (id)}
		{@const tint = filterTint(id, intensity)}

		<ToggleGroup.Item
			value={id}
			class="h-auto min-w-0 flex-col items-stretch gap-1.5 px-0 font-mono text-[10px] font-normal tracking-[0.08em] text-body hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-primary-text"
		>
			<span
				class="relative block h-14 overflow-hidden bg-[#8a7560] outline-offset-2 outline-primary group-data-[state=on]/toggle:outline-2 rail:h-18"
				style:filter={editor.preview ? undefined : filterCss(id, intensity)}
			>
				{#if editor.preview}
					<img src={editor.preview} alt="" class="size-full object-cover" style:filter={filterCss(id, intensity)} />
				{/if}

				{#if tint}
					<span
						class="absolute inset-0 mix-blend-soft-light"
						style:background-color={tint.color}
						style:opacity={tint.opacity}
					></span>
				{/if}
			</span>
			{filterLabels[id]()}
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>

<RangeField
	label={m['session.edit.intensity']()}
	display={String(intensity)}
	value={intensity}
	set={(next) => editor.setLook('intensity', next)}
	oncommit={() => editor.commit()}
	options={{ min: 0, max: 100, disabled: !look || look.filter === 'original' }}
/>

{#if editor.slot !== null}
	<ApplyAll {editor} />
{/if}

<p class="m-0 text-xs leading-normal text-muted-foreground">{m['session.edit.filter_note']()}</p>
