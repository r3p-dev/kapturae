<script lang="ts">
	import RiCloseLine from 'remixicon-svelte/icons/close-line'
	import RiDragMove2Line from 'remixicon-svelte/icons/drag-move-2-line'
	import RiCameraLine from 'remixicon-svelte/icons/camera-line'
	import RiExpandDiagonalSLine from 'remixicon-svelte/icons/expand-diagonal-s-line'
	import RiUploadLine from 'remixicon-svelte/icons/upload-2-line'
	import { SvelteMap } from 'svelte/reactivity'
	import FrameImage from '$lib/components/atoms/frame-image.svelte'
	import { m } from '$lib/paraglide/messages'
	import {
		GRAIN,
		ITEM_SIZE,
		ZOOM,
		clamp,
		filterCss,
		filterTint,
		objectPosition,
		panReach,
		panTransform,
		type Edit,
		type Item,
		type Stroke,
		type Tool
	} from '$lib/editor.svelte'
	import { SIZES, type Frame } from '$lib/session'
	import { STICKER_LABELS } from '$lib/session-messages'
	import { photoFor } from '$lib/shots.svelte'
	import { isStickerId, stickerSrc } from '$lib/stickers'
	import { cn } from '$lib/utils'

	type Brush = { color: string; size: number; isEraser: boolean }

	let {
		frame,
		photos,
		edit = $bindable(),
		tool,
		brush,
		slot = $bindable(null),
		item = $bindable(null),
		move = $bindable(null),
		onselect,
		oncommit,
		class: className
	}: {
		frame: Frame
		photos: string[]
		edit: Edit
		tool: Tool | null
		brush: Brush
		slot?: number | null
		item?: number | null
		move?: { from: number; target: number } | null
		onselect?: (item: Item) => void
		oncommit: () => void
		class?: string
	} = $props()

	const PAN_STEP = 0.1
	const MIN_STEP = 0.4
	const DRAG_SLOP = 4

	let stage = $state<HTMLDivElement>()
	let width = $state(0)

	const height = $derived(100 / SIZES[frame.size].ratio)
	const percentPerPixel = $derived(width ? 100 / width : 0)

	const pointers = new SvelteMap<number, { x: number; y: number }>()
	const aspects = new SvelteMap<string, number>()
	let pinch: { distance: number; zoom: number } | null = null
	let stroke: Stroke | null = null
	let isErasing = false
	let carry: { id: number; x: number; y: number; hasTravelled: boolean; isPicking: boolean } | null = null
	let ghost = $state<{ x: number; y: number } | null>(null)
	let resize: { id: number; centerX: number; centerY: number; distance: number; size: number } | null = null

	function spread() {
		const [first, second] = [...pointers.values()]
		return Math.hypot(first.x - second.x, first.y - second.y)
	}

	function grab(event: PointerEvent) {
		;(event.currentTarget as Element).setPointerCapture(event.pointerId)
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
	}

	function delta(event: PointerEvent) {
		const last = pointers.get(event.pointerId)
		if (!last) {
			return null
		}

		const movement = { x: event.clientX - last.x, y: event.clientY - last.y }
		last.x = event.clientX
		last.y = event.clientY
		return movement
	}

	function release(event: PointerEvent) {
		if (!pointers.delete(event.pointerId)) {
			return
		}

		pinch = null
		stroke = null
		isErasing = false

		if (!pointers.size) {
			oncommit()
		}
	}

	function stageDown(event: PointerEvent) {
		if ((event.target as Element).closest('button')) {
			return
		}

		slot = null
		item = null
		move = null
	}

	function slotDown(event: PointerEvent, index: number) {
		if (move && !pointers.size) {
			if (index !== move.from && photos[index]) {
				return swap(move.from, index)
			}
			move = null
		}

		if (!pointers.size) {
			slot = index
			item = null
		}

		if (slot === null || !photos[slot]) {
			return
		}

		grab(event)

		if (pointers.size === 2) {
			pinch = { distance: spread(), zoom: edit.slots[slot].zoom }
		}
	}

	function reachOf(index: number) {
		const box = frame.slots[index]
		const boxWidth = (box.width / 100) * (stage?.clientWidth ?? 0)
		const boxHeight = (box.height / 100) * (stage?.clientHeight ?? 0)
		return panReach(
			edit.slots[index],
			{ width: boxWidth, height: boxHeight },
			aspects.get(photos[index]) ?? boxWidth / boxHeight
		)
	}

	function pannable(index: number) {
		const reach = reachOf(index)
		return reach.x > 0.5 || reach.y > 0.5
	}

	function slotMove(event: PointerEvent) {
		const movement = delta(event)
		if (!movement || !stage || slot === null) {
			return
		}

		const slotEdit = edit.slots[slot]

		if (pinch && pointers.size === 2) {
			slotEdit.zoom = clamp(Math.round((pinch.zoom * spread()) / pinch.distance), ZOOM.min, ZOOM.max)
			return
		}

		const reach = reachOf(slot)
		if (reach.x > 0.5) {
			slotEdit.x = clamp(slotEdit.x + movement.x / reach.x, -1, 1)
		}

		if (reach.y > 0.5) {
			slotEdit.y = clamp(slotEdit.y + movement.y / reach.y, -1, 1)
		}
	}

	function slotKey(event: KeyboardEvent, index: number) {
		const slotEdit = edit.slots[index]
		const pan = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]

		if (pan && pannable(index)) {
			slotEdit.x = clamp(slotEdit.x + pan[0] * PAN_STEP, -1, 1)
			slotEdit.y = clamp(slotEdit.y + pan[1] * PAN_STEP, -1, 1)
		} else if (event.key === '+' || event.key === '=') {
			slotEdit.zoom = Math.min(ZOOM.max, slotEdit.zoom + ZOOM.step)
		} else if (event.key === '-') {
			slotEdit.zoom = Math.max(ZOOM.min, slotEdit.zoom - ZOOM.step)
		} else {
			return
		}

		event.preventDefault()
		oncommit()
	}

	function swap(from: number, to: number) {
		const { order, slots } = edit
		;[order[from], order[to]] = [order[to], order[from]]
		;[slots[from], slots[to]] = [slots[to], slots[from]]
		slot = to
		item = null
		move = null
		oncommit()
	}

	function slotAt(event: PointerEvent) {
		const box = stage!.getBoundingClientRect()
		const x = ((event.clientX - box.left) / box.width) * 100
		const y = ((event.clientY - box.top) / box.height) * 100
		const index = frame.slots.findIndex(
			(candidate) =>
				x >= candidate.x &&
				x <= candidate.x + candidate.width &&
				y >= candidate.y &&
				y <= candidate.y + candidate.height
		)
		return index !== -1 && index !== move?.from && photos[index] ? index : null
	}

	function handleDown(event: PointerEvent, index: number) {
		if (carry) {
			return
		}

		;(event.currentTarget as Element).setPointerCapture(event.pointerId)
		carry = { id: event.pointerId, x: event.clientX, y: event.clientY, hasTravelled: false, isPicking: move !== null }
		move = { from: index, target: index }
	}

	function handleMove(event: PointerEvent) {
		if (carry?.id !== event.pointerId || !move) {
			return
		}

		if (!carry.hasTravelled && Math.hypot(event.clientX - carry.x, event.clientY - carry.y) < DRAG_SLOP) {
			return
		}

		carry.hasTravelled = true
		const box = stage!.getBoundingClientRect()
		ghost = { x: ((event.clientX - box.left) / box.width) * 100, y: ((event.clientY - box.top) / box.height) * 100 }
		move.target = slotAt(event) ?? move.from
	}

	function handleUp(event: PointerEvent) {
		if (carry?.id !== event.pointerId || !move) {
			return
		}

		const { hasTravelled, isPicking } = carry
		carry = null
		ghost = null
		const dropSlot = hasTravelled ? slotAt(event) : null

		if (dropSlot !== null) {
			swap(move.from, dropSlot)
		} else if (hasTravelled || isPicking) {
			move = null
		}
	}

	function handleCancel() {
		carry = null
		ghost = null
		move = null
	}

	function handleClick(event: MouseEvent, index: number) {
		if (event.detail) {
			return
		}

		if (!move) {
			move = { from: index, target: index }
		} else if (move.target !== move.from) {
			swap(move.from, move.target)
		} else {
			move = null
		}
	}

	function handleKey(event: KeyboardEvent) {
		if (!move) {
			return
		}

		const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key]
		if (!step) {
			return
		}

		event.preventDefault()
		const count = frame.slots.length
		let next = move.target

		do {
			next = (next + step + count) % count
		} while ((next === move.from || !photos[next]) && next !== move.target)
		move.target = next
	}

	function itemDown(event: PointerEvent, entry: Item) {
		item = entry.id
		move = null
		onselect?.(entry)
		grab(event)
	}

	function itemMove(event: PointerEvent, entry: Item) {
		const movement = delta(event)
		if (!movement || !stage) {
			return
		}

		entry.x = clamp(entry.x + movement.x * percentPerPixel, 0, 100)
		entry.y = clamp(entry.y + (movement.y / stage.clientHeight) * 100, 0, 100)
	}

	function remove(entry: Item) {
		edit.items = edit.items.filter((other) => other.id !== entry.id)
		item = null
		oncommit()
	}

	function resizeDown(event: PointerEvent, entry: Item) {
		const handle = event.currentTarget as Element
		const box = handle.parentElement!.getBoundingClientRect()
		const centerX = box.left + box.width / 2
		const centerY = box.top + box.height / 2
		handle.setPointerCapture(event.pointerId)
		resize = {
			id: event.pointerId,
			centerX,
			centerY,
			distance: Math.max(1, Math.hypot(event.clientX - centerX, event.clientY - centerY)),
			size: entry.size
		}
	}

	function resizeMove(event: PointerEvent, entry: Item) {
		if (resize?.id !== event.pointerId) {
			return
		}

		const { min, max } = ITEM_SIZE[entry.kind]
		const scale = Math.hypot(event.clientX - resize.centerX, event.clientY - resize.centerY) / resize.distance
		entry.size = clamp(Math.round(resize.size * scale), min, max)
	}

	function resizeUp(event: PointerEvent) {
		if (resize?.id !== event.pointerId) {
			return
		}

		resize = null
		oncommit()
	}

	function itemKey(event: KeyboardEvent, entry: Item) {
		const nudge = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]

		if (nudge) {
			entry.x = clamp(entry.x + nudge[0], 0, 100)
			entry.y = clamp(entry.y + nudge[1], 0, 100)
		} else if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault()
			return remove(entry)
		} else {
			return
		}

		event.preventDefault()
		oncommit()
	}

	function point(event: PointerEvent) {
		const box = stage!.getBoundingClientRect()
		return [(event.clientX - box.left) * percentPerPixel, (event.clientY - box.top) * percentPerPixel]
	}

	function erase([x, y]: number[]) {
		const reach = Math.max(3, brush.size * percentPerPixel)
		edit.strokes = edit.strokes.filter((existing) => {
			for (const [index, coordinate] of existing.points.entries()) {
				if (
					index % 2 === 0 &&
					Math.hypot(coordinate - x, existing.points[index + 1] - y) < reach + existing.width / 2
				) {
					return false
				}
			}
			return true
		})
	}

	function brushDown(event: PointerEvent) {
		if (pointers.size) {
			return
		}

		grab(event)
		const [x, y] = point(event)

		if (brush.isEraser) {
			isErasing = true
			erase([x, y])
			return
		}

		edit.strokes.push({ color: brush.color, width: brush.size * percentPerPixel, points: [x, y, x, y] })
		stroke = edit.strokes[edit.strokes.length - 1]
	}

	function brushMove(event: PointerEvent) {
		if (!pointers.has(event.pointerId)) {
			return
		}

		const [x, y] = point(event)

		if (isErasing) {
			return erase([x, y])
		}

		if (!stroke) {
			return
		}

		const { length } = stroke.points
		if (Math.hypot(stroke.points[length - 2] - x, stroke.points[length - 1] - y) >= MIN_STEP) {
			stroke.points.push(x, y)
		}
	}

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
				aspects.set(photos[index], image.naturalWidth / image.naturalHeight)
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

		{#if source && slot !== index}
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
<div bind:this={stage} bind:clientWidth={width} onpointerdown={stageDown} class={cn('relative select-none', className)}>
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
			aria-pressed={slot === index}
			data-active={slot === index && item === null ? '' : undefined}
			onpointerdown={(event) => slotDown(event, index)}
			onpointermove={slotMove}
			onpointerup={release}
			onpointercancel={release}
			onkeydown={(event) => slotKey(event, index)}
			class={cn(
				'absolute touch-none outline-offset-3 outline-primary focus-visible:outline-3 data-active:outline-3',
				photos[index] && width && pannable(index) ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
				move &&
					index !== move.from &&
					photos[index] &&
					(move.target === index
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
		{@const isSelected = item === entry.id}

		<div
			class="absolute -translate-1/2"
			style:left="{entry.x}%"
			style:top="{entry.y}%"
			style:width={entry.kind === 'sticker' ? `${entry.size}%` : undefined}
		>
			<button
				type="button"
				aria-label={entry.kind === 'text'
					? entry.text
					: isStickerId(entry.sticker)
						? STICKER_LABELS[entry.sticker]()
						: m['session.edit.sticker_upload']()}
				aria-pressed={isSelected}
				onpointerdown={(event) => itemDown(event, entry)}
				onpointermove={(event) => itemMove(event, entry)}
				onpointerup={release}
				onpointercancel={release}
				onkeydown={(event) => itemKey(event, entry)}
				class="block w-full cursor-move touch-none outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary aria-pressed:shadow-[0_0_0_1px_rgba(14,14,13,0.55)] aria-pressed:outline-2 aria-pressed:outline-paper aria-pressed:outline-dashed"
			>
				{#if entry.kind === 'sticker'}
					<img src={stickerSrc(entry.sticker)} alt="" draggable="false" class="block w-full" />
				{:else}
					<span
						class={cn('block leading-none whitespace-pre', fonts[entry.font])}
						style:color={entry.color}
						style:font-size="{(entry.size * width) / 100}percentPerPixel"
					>
						{entry.text}
					</span>
				{/if}
			</button>

			{#if isSelected && tool !== 'brush'}
				<button
					type="button"
					aria-label={m['session.edit.remove']()}
					onclick={() => remove(entry)}
					class="{handle} -top-3.5 -right-3.5 bg-primary text-primary-foreground"
				>
					<RiCloseLine aria-hidden="true" class="size-3.5" />
				</button>

				<button
					type="button"
					aria-label={m['session.edit.resize']()}
					tabindex={-1}
					onpointerdown={(event) => resizeDown(event, entry)}
					onpointermove={(event) => resizeMove(event, entry)}
					onpointerup={resizeUp}
					onpointercancel={resizeUp}
					class="{handle} -bottom-3.5 -left-3.5 cursor-nesw-resize touch-none bg-paper text-ink"
				>
					<RiExpandDiagonalSLine aria-hidden="true" class="size-3.5" />
				</button>
			{/if}
		</div>
	{/each}

	{#if slot !== null && photos[slot] && tool !== 'brush'}
		{@const box = frame.slots[slot]}
		{@const selected = slot}

		<button
			type="button"
			aria-label={m['session.edit.move']({ n: selected + 1 })}
			aria-pressed={move?.from === selected}
			onpointerdown={(event) => handleDown(event, selected)}
			onpointermove={handleMove}
			onpointerup={handleUp}
			onpointercancel={handleCancel}
			onclick={(event) => handleClick(event, selected)}
			onkeydown={handleKey}
			class="absolute m-1.5 flex size-9 cursor-grab touch-none items-center justify-center bg-paper text-ink outline-offset-2 outline-primary focus-visible:outline-3 active:cursor-grabbing aria-pressed:bg-primary aria-pressed:text-primary-foreground"
			style:left="{box.x}%"
			style:top="{box.y}%"
		>
			<RiDragMove2Line aria-hidden="true" class="size-4.5" />
		</button>
	{/if}

	{#if ghost && move}
		{@const box = frame.slots[move.from]}

		<img
			src={photos[move.from]}
			alt=""
			draggable="false"
			class="pointer-events-none absolute -translate-1/2 object-cover opacity-85 shadow-lg ring-2 ring-paper"
			style:left="{ghost.x}%"
			style:top="{ghost.y}%"
			style:width="{box.width * 0.6}%"
			style:height="{box.height * 0.6}%"
		/>
	{/if}

	{#if tool === 'brush'}
		<div
			aria-hidden="true"
			onpointerdown={brushDown}
			onpointermove={brushMove}
			onpointerup={release}
			onpointercancel={release}
			class="absolute inset-0 cursor-crosshair touch-none"
		></div>
	{/if}
</div>
