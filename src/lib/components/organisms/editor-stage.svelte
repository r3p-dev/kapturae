<script lang="ts">
	import RiCloseLine from 'remixicon-svelte/icons/close-line'
	import RiDragMove2Line from 'remixicon-svelte/icons/drag-move-2-line'
	import RiCameraLine from 'remixicon-svelte/icons/camera-line'
	import RiExpandDiagonalSLine from 'remixicon-svelte/icons/expand-diagonal-s-line'
	import RiUploadLine from 'remixicon-svelte/icons/upload-2-line'
	import FrameImage from '$lib/components/atoms/frame-image.svelte'
	import type { EditState } from '$lib/editor/edit-state.svelte'
	import { GRAIN, filterCss, filterTint, objectPosition, panTransform } from '$lib/editor/editor.svelte'
	import { StageGestures } from '$lib/editor/stage-gestures.svelte'
	import { STICKER_LABELS } from '$lib/i18n/messages'
	import { m } from '$lib/paraglide/messages'
	import { SIZES } from '$lib/session/session'
	import { photoFor } from '$lib/session/shots.svelte'
	import { isStickerId, stickerSrc } from '$lib/stickers/stickers'
	import { cn } from '$lib/utils'

	let { editor, class: className }: { editor: EditState; class?: string } = $props()

	const gestures = $derived(new StageGestures(editor))

	const frame = $derived(editor.shown)
	const photos = $derived(editor.photos)
	const edit = $derived(editor.edit)
	const height = $derived(100 / SIZES[frame.size].ratio)

	const handle =
		"absolute flex size-6 items-center justify-center before:absolute before:-inset-2.5 before:content-['']"

	const fonts = {
		bold: 'font-display font-extrabold tracking-[0.08em] font-stretch-112%',
		mono: 'font-mono',
		serif: 'font-serif italic'
	}
</script>

{#snippet photo(index: number)}
	{#if photos[index]}
		{@const slotEdit = edit.slots[index]}
		{@const tint = filterTint(slotEdit.filter, slotEdit.intensity)}
		{@const source = photoFor(photos[index])?.source}

		<img
			src={photos[index]}
			alt=""
			draggable="false"
			onload={(event) => {
				const image = event.currentTarget as HTMLImageElement
				gestures.aspects.set(photos[index], image.naturalWidth / image.naturalHeight)
			}}
			class="absolute inset-0 size-full object-cover"
			style:object-position={objectPosition(slotEdit)}
			style:transform={panTransform(slotEdit)}
			style:filter={filterCss(slotEdit.filter, slotEdit.intensity, slotEdit)}
		/>

		{#if tint}
			<span
				class="absolute inset-0 mix-blend-soft-light"
				style:background-color={tint.color}
				style:opacity={tint.opacity}
			></span>
		{/if}

		{#if slotEdit.warmth}
			<span
				class="absolute inset-0 mix-blend-soft-light"
				style:background-color={slotEdit.warmth > 0 ? '#ff8a1f' : '#2f7bff'}
				style:opacity={Math.abs(slotEdit.warmth) / 200}
			></span>
		{/if}

		{#if slotEdit.grain}
			<span
				class="absolute inset-0 mix-blend-overlay"
				style:background-image={`url("${GRAIN}")`}
				style:opacity={(slotEdit.grain / 100) * 0.6}
			></span>
		{/if}

		{#if source && editor.slot !== index}
			<span
				title={source === 'upload' ? m['session.source.from_upload']() : m['session.source.from_camera']()}
				class="absolute top-1.5 left-1.5 flex size-5.5 items-center justify-center bg-ink/70 text-paper"
			>
				{#if source === 'upload'}
					<RiUploadLine aria-hidden="true" class="size-3" />
				{:else}
					<RiCameraLine aria-hidden="true" class="size-3" />
				{/if}
			</span>
		{/if}
	{:else}
		<span class="absolute inset-0 flex items-center justify-center font-display text-[22px] font-black text-[#8c8983]">
			{index + 1}
		</span>
	{/if}
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={gestures.stage}
	bind:clientWidth={gestures.width}
	onpointerdown={(event) => gestures.stageDown(event)}
	class={cn('relative select-none', className)}
>
	<FrameImage {frame} {photo} />

	<svg
		aria-hidden="true"
		viewBox="0 0 100 {height}"
		class="pointer-events-none absolute inset-0 size-full overflow-visible"
		fill="none"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		{#each edit.strokes as line, index (index)}
			<polyline points={line.points.join(' ')} stroke={line.color} stroke-width={line.width} />
		{/each}
	</svg>

	{#each frame.slots as box, index (index)}
		<button
			type="button"
			aria-label={m['session.edit.slot']({ n: index + 1 })}
			aria-pressed={editor.slot === index}
			data-active={editor.slot === index && editor.item === null ? '' : undefined}
			onpointerdown={(event) => gestures.slotDown(event, index)}
			onpointermove={(event) => gestures.slotMove(event)}
			onpointerup={(event) => gestures.release(event)}
			onpointercancel={(event) => gestures.release(event)}
			onlostpointercapture={(event) => gestures.release(event)}
			onkeydown={(event) => gestures.slotKey(event, index)}
			class={cn(
				'absolute touch-none outline-offset-3 outline-primary focus-visible:outline-3 data-active:outline-3',
				photos[index] && gestures.width && gestures.pannable(index)
					? 'cursor-grab active:cursor-grabbing'
					: 'cursor-pointer',
				editor.move &&
					index !== editor.move.from &&
					photos[index] &&
					(editor.move.target === index
						? 'bg-paper/25 outline-3 outline-paper'
						: 'cursor-pointer outline-2 outline-paper/70 outline-dashed')
			)}
			style:left="{box.x}%"
			style:top="{box.y}%"
			style:width="{box.width}%"
			style:height="{box.height}%"
		></button>
	{/each}

	{#each edit.items as entry (entry.id)}
		{@const isSelected = editor.item === entry.id}

		<div
			class="absolute -translate-1/2"
			style:left="{entry.x}%"
			style:top="{entry.y}%"
			style:width={entry.kind === 'sticker' ? `${entry.size}%` : undefined}
		>
			<button
				type="button"
				data-stage-drag=""
				aria-label={entry.kind === 'text'
					? entry.text
					: isStickerId(entry.sticker)
						? STICKER_LABELS[entry.sticker]()
						: m['session.edit.sticker_upload']()}
				aria-pressed={isSelected}
				onpointerdown={(event) => gestures.itemDown(event, entry)}
				onpointermove={(event) => gestures.itemMove(event, entry)}
				onpointerup={(event) => gestures.release(event)}
				onpointercancel={(event) => gestures.release(event)}
				onlostpointercapture={(event) => gestures.release(event)}
				onkeydown={(event) => gestures.itemKey(event, entry)}
				class="block w-full cursor-move touch-none outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary aria-pressed:shadow-[0_0_0_1px_rgba(14,14,13,0.55)] aria-pressed:outline-2 aria-pressed:outline-paper aria-pressed:outline-dashed"
			>
				{#if entry.kind === 'sticker'}
					<img src={stickerSrc(entry.sticker)} alt="" draggable="false" class="block w-full" />
				{:else}
					<span
						class={cn('block leading-none whitespace-pre', fonts[entry.font])}
						style:color={entry.color}
						style:font-size="{(entry.size * gestures.width) / 100}px"
					>
						{entry.text}
					</span>
				{/if}
			</button>

			{#if isSelected && editor.tool !== 'brush'}
				<button
					type="button"
					aria-label={m['session.edit.remove']()}
					onclick={() => gestures.remove(entry)}
					class="{handle} -top-3.5 -right-3.5 bg-primary text-primary-foreground"
				>
					<RiCloseLine aria-hidden="true" class="size-3.5" />
				</button>

				<button
					type="button"
					data-stage-drag=""
					aria-label={m['session.edit.resize']()}
					tabindex={-1}
					onpointerdown={(event) => gestures.resizeDown(event, entry)}
					onpointermove={(event) => gestures.resizeMove(event, entry)}
					onpointerup={(event) => gestures.resizeUp(event)}
					onpointercancel={(event) => gestures.resizeUp(event)}
					onlostpointercapture={(event) => gestures.resizeUp(event)}
					class="{handle} -bottom-3.5 -left-3.5 cursor-nesw-resize touch-none bg-paper text-ink"
				>
					<RiExpandDiagonalSLine aria-hidden="true" class="size-3.5" />
				</button>
			{/if}
		</div>
	{/each}

	{#if editor.slot !== null && photos[editor.slot] && editor.tool !== 'brush'}
		{@const selected = editor.slot}
		{@const box = frame.slots[selected]}

		<button
			type="button"
			data-stage-drag=""
			aria-label={m['session.edit.move']({ n: selected + 1 })}
			aria-pressed={editor.move?.from === selected}
			onpointerdown={(event) => gestures.handleDown(event, selected)}
			onpointermove={(event) => gestures.handleMove(event)}
			onpointerup={(event) => gestures.handleUp(event)}
			onpointercancel={() => gestures.handleCancel()}
			onlostpointercapture={() => gestures.handleCancel()}
			onclick={(event) => gestures.handleClick(event, selected)}
			onkeydown={(event) => gestures.handleKey(event)}
			class="absolute m-1.5 flex size-9 cursor-grab touch-none items-center justify-center bg-paper text-ink outline-offset-2 outline-primary focus-visible:outline-3 active:cursor-grabbing aria-pressed:bg-primary aria-pressed:text-primary-foreground"
			style:left="{box.x}%"
			style:top="{box.y}%"
		>
			<RiDragMove2Line aria-hidden="true" class="size-4.5" />
		</button>
	{/if}

	{#if gestures.ghost && editor.move}
		{@const ghost = gestures.ghost}
		{@const box = frame.slots[editor.move.from]}

		<img
			src={photos[editor.move.from]}
			alt=""
			draggable="false"
			class="pointer-events-none absolute -translate-1/2 object-cover opacity-85 shadow-lg ring-2 ring-paper"
			style:left="{ghost.x}%"
			style:top="{ghost.y}%"
			style:width="{box.width * 0.6}%"
			style:height="{box.height * 0.6}%"
		/>
	{/if}

	{#if editor.tool === 'brush'}
		<div
			aria-hidden="true"
			data-stage-drag=""
			onpointerdown={(event) => gestures.brushDown(event)}
			onpointermove={(event) => gestures.brushMove(event)}
			onpointerup={(event) => gestures.release(event)}
			onpointercancel={(event) => gestures.release(event)}
			onlostpointercapture={(event) => gestures.release(event)}
			class="absolute inset-0 cursor-crosshair touch-none"
		></div>
	{/if}
</div>
