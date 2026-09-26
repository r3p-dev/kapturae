<script lang="ts">
	import RiAddLine from 'remixicon-svelte/icons/add-line'
	import RiRestartLine from 'remixicon-svelte/icons/restart-line'
	import RiSubtractLine from 'remixicon-svelte/icons/subtract-line'
	import RiUploadLine from 'remixicon-svelte/icons/upload-2-line'
	import { Slider } from '$lib/components/ui/slider'
	import * as ToggleGroup from '$lib/components/ui/toggle-group'
	import { ZOOM_BUTTON_STEP, type EditState, type ReplaceMode } from '$lib/editor/edit-state.svelte'
	import { ZOOM } from '$lib/editor/editor.svelte'
	import { m } from '$lib/paraglide/messages'
	import PhotoSource from './photo-source.svelte'
	import { edge, mono, square } from './styles'

	let { editor }: { editor: EditState } = $props()
</script>

<div class="mt-22 hidden w-59 flex-col gap-3.5 border {edge} bg-card p-4.5 desktop:flex">
	{#if editor.slot === null || !editor.current}
		<p class="m-0 text-[13px] leading-normal text-muted-foreground">{m['session.edit.select_slot']()}</p>
	{:else}
		{@const current = editor.current}

		<div class="flex flex-col gap-1.5">
			<span class="{mono} text-[11px] text-muted-foreground">{m['session.edit.slot']({ n: editor.slot + 1 })}</span>
			{#if editor.slotPhoto}
				<PhotoSource photo={editor.slotPhoto} />
			{/if}
		</div>

		<div class="flex flex-col gap-2">
			<div class="flex justify-between text-[13px]">
				<span>{m['session.edit.zoom']()}</span>
				<span class="font-mono text-muted-foreground">{current.zoom}%</span>
			</div>

			<div class="flex items-center gap-1.5">
				<button
					type="button"
					onclick={() => editor.zoomBy(-ZOOM_BUTTON_STEP)}
					disabled={!editor.hasPhoto || current.zoom <= ZOOM.min}
					aria-label={m['session.edit.zoom_out']()}
					class={square}
				>
					<RiSubtractLine aria-hidden="true" class="size-4.5" />
				</button>

				<Slider
					type="single"
					value={current.zoom}
					onValueChange={(next) => (current.zoom = next)}
					onValueCommit={() => editor.commit()}
					min={ZOOM.min}
					max={ZOOM.max}
					step={ZOOM.step}
					disabled={!editor.hasPhoto}
					aria-label={m['session.edit.zoom']()}
					class="min-w-0 flex-1"
				/>

				<button
					type="button"
					onclick={() => editor.zoomBy(ZOOM_BUTTON_STEP)}
					disabled={!editor.hasPhoto || current.zoom >= ZOOM.max}
					aria-label={m['session.edit.zoom_in']()}
					class={square}
				>
					<RiAddLine aria-hidden="true" class="size-4.5" />
				</button>
			</div>

			<p class="m-0 text-xs leading-normal text-muted-foreground">{m['session.edit.no_crop']()}</p>
		</div>

		<div class="h-px bg-[#2a2a28]"></div>

		<span class="{mono} text-[11px] text-muted-foreground">
			{editor.hasPhoto ? m['session.replace.title']() : m['session.replace.fill']()}
		</span>

		<ToggleGroup.Root
			type="single"
			orientation="vertical"
			spacing={2}
			aria-label={editor.hasPhoto ? m['session.replace.title']() : m['session.replace.fill']()}
			bind:value={
				() => (editor.isReplacingSlot ? (editor.replace ?? '') : ''),
				(next) => (next ? editor.openReplace(next as ReplaceMode) : (editor.replace = null))
			}
			class="w-full"
		>
			{#each [['camera', RiRestartLine, m['session.replace.camera']()], ['upload', RiUploadLine, m['session.replace.upload']()]] as const as [value, Icon, label] (value)}
				<ToggleGroup.Item
					{value}
					class="h-12 w-full justify-start gap-2.5 border-[1.5px] border-paper px-3.5 font-mono text-xs font-medium tracking-widest hover:bg-paper/10 data-[state=on]:bg-paper data-[state=on]:text-ink"
				>
					<Icon aria-hidden="true" class="size-4" />
					{label}
				</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>

		<p class="m-0 text-xs leading-[1.45] text-muted-foreground">{m['session.replace.note']()}</p>
	{/if}
</div>
