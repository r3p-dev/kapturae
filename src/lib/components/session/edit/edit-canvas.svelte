<script lang="ts">
	import Corners from '$lib/components/atoms/corners.svelte'
	import FrameZoom from '$lib/components/atoms/frame-zoom.svelte'
	import EditorStage from '$lib/components/organisms/editor-stage.svelte'
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import { m } from '$lib/paraglide/messages'
	import { SIZES } from '$lib/session/session'
	import { cn } from '$lib/utils'
	import FinishButton from './finish-button.svelte'
	import HistoryButtons from './history-buttons.svelte'
	import SlotActions from './slot-actions.svelte'
	import SlotCard from './slot-card.svelte'
	import { edge, mono } from './styles'

	let { editor }: { editor: EditState } = $props()
	let isZoomed = $state(false)

	const stageHeight =
		'[--h:min(calc(100cqh-50px),calc((100cqw-220px)*var(--r)))] desktop:[--h:min(calc(100cqh-148px),calc((100cqw-380px)*var(--r)))]'
</script>

<section
	aria-label={m['session.edit.canvas_label']()}
	class={cn('flex shrink-0 flex-col bg-[#0a0a09] rail:min-w-0 rail:flex-1', !editor.tool && 'min-h-0 flex-1')}
>
	<div class="hidden h-14 shrink-0 items-center justify-between gap-4 border-b {edge} px-4 rail:flex">
		<div class="flex gap-2"><HistoryButtons history={editor.history} /></div>

		<span class="{mono} min-w-0 truncate text-xs tracking-[0.12em] text-muted-foreground" aria-live="polite">
			{editor.hint ??
				(editor.slot === null ? m['session.edit.hint_none']() : m['session.edit.hint_slot']({ n: editor.slot + 1 }))}
		</span>

		<FinishButton {editor} class="px-5" />
	</div>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={(event) => {
			if ((event.target as Element).closest('button, .cursor-crosshair')) {
				return
			}
			editor.slot = null
			editor.item = null
			editor.move = null
		}}
		class={cn(
			'@container-size relative flex h-[min(470px,56svh)] items-center justify-center overflow-hidden rail:h-auto rail:flex-1',
			!editor.tool && 'h-auto flex-1'
		)}
		style:--r={1 / SIZES[editor.frame.size].ratio}
	>
		<Corners inset="18px" size="24px" weight="2px" class="pointer-events-none z-10 hidden text-[#3a3936] rail:block" />

		<div class={cn('absolute top-2.5 z-10 flex gap-1.5 rail:hidden', isZoomed ? 'left-22' : 'left-2.5')}>
			<HistoryButtons history={editor.history} />
		</div>

		<FrameZoom bind:isZoomed resetKey={editor.frame.id} class="absolute inset-0">
			<div class="flex items-center justify-center desktop:gap-7">
				<EditorStage {editor} class={stageHeight} />
				<div aria-hidden="true" class="pointer-events-none hidden w-59 shrink-0 desktop:block"></div>
			</div>
		</FrameZoom>

		{#if !isZoomed || editor.current}
			<div class="pointer-events-none relative z-10 hidden items-center justify-center desktop:flex desktop:gap-7">
				<div
					aria-hidden="true"
					class="pointer-events-none h-(--h) shrink-0 {stageHeight}"
					style:width="calc(var(--h) * {SIZES[editor.frame.size].ratio})"
				></div>
				<div class="pointer-events-auto">
					<SlotCard {editor} />
				</div>
			</div>
		{/if}

		{#if editor.slot !== null && editor.current && editor.tool !== 'brush'}
			<SlotActions {editor} current={editor.current} />
		{/if}

		<span
			class="{mono} pointer-events-none absolute inset-x-0 bottom-2.5 z-10 text-center text-[10px] tracking-widest text-muted-foreground rail:hidden"
		>
			{editor.hint ?? m['session.edit.hint_touch']()}
		</span>
	</div>
</section>
