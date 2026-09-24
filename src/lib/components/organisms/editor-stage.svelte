<script lang="ts">
	import RiCloseLine from 'remixicon-svelte/icons/close-line'
	import RiDragMove2Line from 'remixicon-svelte/icons/drag-move-2-line'
	import RiExpandDiagonalSLine from 'remixicon-svelte/icons/expand-diagonal-s-line'
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
		panTransform,
		type Edit,
		type Item,
		type Stroke,
		type Tool
	} from '$lib/editor.svelte'
	import { SIZES, type Frame } from '$lib/session'
	import { STICKER_LABELS } from '$lib/session-messages'
	import { isStickerId, stickerSrc } from '$lib/stickers'
	import { cn } from '$lib/utils'

	type Brush = { color: string; size: number; eraser: boolean }

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
	const px = $derived(width ? 100 / width : 0)

	const pointers = new SvelteMap<number, { x: number; y: number }>()
	let pinch: { dist: number; zoom: number } | null = null
	let stroke: Stroke | null = null
	let erasing = false
	let carry: { id: number; x: number; y: number; travelled: boolean; picking: boolean } | null = null
	let ghost = $state<{ x: number; y: number } | null>(null)
	let resize: { id: number; cx: number; cy: number; dist: number; size: number } | null = null

	function spread() {
		const [a, b] = [...pointers.values()]
		return Math.hypot(a.x - b.x, a.y - b.y)
	}

	function grab(e: PointerEvent) {
		;(e.currentTarget as Element).setPointerCapture(e.pointerId)
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
	}

	function delta(e: PointerEvent) {
		const p = pointers.get(e.pointerId)
		if (!p) return null
		const d = { x: e.clientX - p.x, y: e.clientY - p.y }
		p.x = e.clientX
		p.y = e.clientY
		return d
	}

	function release(e: PointerEvent) {
		if (!pointers.delete(e.pointerId)) return
		pinch = null
		stroke = null
		erasing = false
		if (!pointers.size) oncommit()
	}

	function stageDown(e: PointerEvent) {
		if ((e.target as Element).closest('button')) return
		slot = null
		item = null
		move = null
	}

	function slotDown(e: PointerEvent, i: number) {
		if (move && !pointers.size) {
			if (i !== move.from && photos[i]) return swap(move.from, i)
			move = null
		}

		if (!pointers.size) {
			slot = i
			item = null
		}

		if (slot === null || !photos[slot]) return

		grab(e)

		if (pointers.size === 2) pinch = { dist: spread(), zoom: edit.slots[slot].zoom }
	}

	function slotMove(e: PointerEvent) {
		const d = delta(e)
		if (!d || !stage || slot === null) return
		const s = edit.slots[slot]

		if (pinch && pointers.size === 2) {
			s.zoom = clamp(Math.round((pinch.zoom * spread()) / pinch.dist), ZOOM.min, ZOOM.max)
			return
		}

		const reach = (s.zoom / 100 - 1) / 2
		if (reach <= 0) return
		const box = frame.slots[slot]
		s.x = clamp(s.x + d.x / (reach * ((box.w / 100) * stage.clientWidth)), -1, 1)
		s.y = clamp(s.y + d.y / (reach * ((box.h / 100) * stage.clientHeight)), -1, 1)
	}

	function slotKey(e: KeyboardEvent, i: number) {
		const s = edit.slots[i]
		const pan = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]

		if (pan && s.zoom > ZOOM.min) {
			s.x = clamp(s.x + pan[0] * PAN_STEP, -1, 1)
			s.y = clamp(s.y + pan[1] * PAN_STEP, -1, 1)
		} else if (e.key === '+' || e.key === '=') {
			s.zoom = Math.min(ZOOM.max, s.zoom + ZOOM.step)
		} else if (e.key === '-') {
			s.zoom = Math.max(ZOOM.min, s.zoom - ZOOM.step)
		} else return

		e.preventDefault()
		oncommit()
	}

	function swap(a: number, b: number) {
		const { order, slots } = edit
		;[order[a], order[b]] = [order[b], order[a]]
		;[slots[a], slots[b]] = [slots[b], slots[a]]
		slot = b
		item = null
		move = null
		oncommit()
	}

	function slotAt(e: PointerEvent) {
		const box = stage!.getBoundingClientRect()
		const x = ((e.clientX - box.left) / box.width) * 100
		const y = ((e.clientY - box.top) / box.height) * 100
		const i = frame.slots.findIndex((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h)
		return i !== -1 && i !== move?.from && photos[i] ? i : null
	}

	function handleDown(e: PointerEvent, i: number) {
		if (carry) return
		;(e.currentTarget as Element).setPointerCapture(e.pointerId)
		carry = { id: e.pointerId, x: e.clientX, y: e.clientY, travelled: false, picking: move !== null }
		move = { from: i, target: i }
	}

	function handleMove(e: PointerEvent) {
		if (carry?.id !== e.pointerId || !move) return
		if (!carry.travelled && Math.hypot(e.clientX - carry.x, e.clientY - carry.y) < DRAG_SLOP) return
		carry.travelled = true
		const box = stage!.getBoundingClientRect()
		ghost = { x: ((e.clientX - box.left) / box.width) * 100, y: ((e.clientY - box.top) / box.height) * 100 }
		move.target = slotAt(e) ?? move.from
	}

	function handleUp(e: PointerEvent) {
		if (carry?.id !== e.pointerId || !move) return
		const { travelled, picking } = carry
		carry = null
		ghost = null
		const over = travelled ? slotAt(e) : null

		if (over !== null) swap(move.from, over)
		else if (travelled || picking) move = null
	}

	function handleCancel() {
		carry = null
		ghost = null
		move = null
	}

	function handleClick(e: MouseEvent, i: number) {
		if (e.detail) return
		if (!move) move = { from: i, target: i }
		else if (move.target !== move.from) swap(move.from, move.target)
		else move = null
	}

	function handleKey(e: KeyboardEvent) {
		if (!move) return
		const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key]
		if (!step) return

		e.preventDefault()
		const count = frame.slots.length
		let next = move.target
		do next = (next + step + count) % count
		while ((next === move.from || !photos[next]) && next !== move.target)
		move.target = next
	}

	function itemDown(e: PointerEvent, it: Item) {
		item = it.id
		move = null
		onselect?.(it)
		grab(e)
	}

	function itemMove(e: PointerEvent, it: Item) {
		const d = delta(e)
		if (!d || !stage) return
		it.x = clamp(it.x + d.x * px, 0, 100)
		it.y = clamp(it.y + (d.y / stage.clientHeight) * 100, 0, 100)
	}

	function remove(it: Item) {
		edit.items = edit.items.filter((other) => other.id !== it.id)
		item = null
		oncommit()
	}

	function resizeDown(e: PointerEvent, it: Item) {
		const handle = e.currentTarget as Element
		const box = handle.parentElement!.getBoundingClientRect()
		const cx = box.left + box.width / 2
		const cy = box.top + box.height / 2
		handle.setPointerCapture(e.pointerId)
		resize = { id: e.pointerId, cx, cy, dist: Math.max(1, Math.hypot(e.clientX - cx, e.clientY - cy)), size: it.size }
	}

	function resizeMove(e: PointerEvent, it: Item) {
		if (resize?.id !== e.pointerId) return
		const { min, max } = ITEM_SIZE[it.kind]
		const scale = Math.hypot(e.clientX - resize.cx, e.clientY - resize.cy) / resize.dist
		it.size = clamp(Math.round(resize.size * scale), min, max)
	}

	function resizeUp(e: PointerEvent) {
		if (resize?.id !== e.pointerId) return
		resize = null
		oncommit()
	}

	function itemKey(e: KeyboardEvent, it: Item) {
		const nudge = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]

		if (nudge) {
			it.x = clamp(it.x + nudge[0], 0, 100)
			it.y = clamp(it.y + nudge[1], 0, 100)
		} else if (e.key === 'Delete' || e.key === 'Backspace') {
			e.preventDefault()
			return remove(it)
		} else return

		e.preventDefault()
		oncommit()
	}

	function point(e: PointerEvent) {
		const box = stage!.getBoundingClientRect()
		return [(e.clientX - box.left) * px, (e.clientY - box.top) * px]
	}

	function erase([x, y]: number[]) {
		const reach = Math.max(3, brush.size * px)
		edit.strokes = edit.strokes.filter((s) => {
			for (let i = 0; i < s.points.length; i += 2) {
				if (Math.hypot(s.points[i] - x, s.points[i + 1] - y) < reach + s.width / 2) return false
			}
			return true
		})
	}

	function brushDown(e: PointerEvent) {
		if (pointers.size) return
		grab(e)
		const [x, y] = point(e)

		if (brush.eraser) {
			erasing = true
			erase([x, y])
			return
		}

		edit.strokes.push({ color: brush.color, width: brush.size * px, points: [x, y, x, y] })
		stroke = edit.strokes[edit.strokes.length - 1]
	}

	function brushMove(e: PointerEvent) {
		if (!pointers.has(e.pointerId)) return
		const [x, y] = point(e)

		if (erasing) return erase([x, y])
		if (!stroke) return

		const n = stroke.points.length
		if (Math.hypot(stroke.points[n - 2] - x, stroke.points[n - 1] - y) >= MIN_STEP) stroke.points.push(x, y)
	}

	const handle =
		"absolute flex size-6 items-center justify-center before:absolute before:-inset-2.5 before:content-['']"

	const fonts = {
		bold: 'font-display font-extrabold tracking-[0.08em] font-stretch-112%',
		mono: 'font-mono',
		serif: 'font-serif italic'
	}
</script>

{#snippet photo(i: number)}
	{#if photos[i]}
		{@const s = edit.slots[i]}
		{@const tint = filterTint(s.filter, s.intensity)}

		<img
			src={photos[i]}
			alt=""
			draggable="false"
			class="absolute inset-0 size-full object-cover"
			style:transform={panTransform(s)}
			style:filter={filterCss(s.filter, s.intensity, s)}
		/>

		{#if tint}
			<span
				class="absolute inset-0 mix-blend-soft-light"
				style:background-color={tint.color}
				style:opacity={tint.opacity}
			></span>
		{/if}

		{#if s.warmth}
			<span
				class="absolute inset-0 mix-blend-soft-light"
				style:background-color={s.warmth > 0 ? '#ff8a1f' : '#2f7bff'}
				style:opacity={Math.abs(s.warmth) / 200}
			></span>
		{/if}

		{#if s.grain}
			<span
				class="absolute inset-0 mix-blend-overlay"
				style:background-image={`url("${GRAIN}")`}
				style:opacity={(s.grain / 100) * 0.6}
			></span>
		{/if}
	{:else}
		<span class="absolute inset-0 flex items-center justify-center font-display text-[22px] font-black text-[#8c8983]">
			{i + 1}
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
		{#each edit.strokes as s, i (i)}
			<polyline points={s.points.join(' ')} stroke={s.color} stroke-width={s.width} />
		{/each}
	</svg>

	{#each frame.slots as box, i (i)}
		<button
			type="button"
			aria-label={m['session.edit.slot']({ n: i + 1 })}
			aria-pressed={slot === i}
			data-active={slot === i && item === null ? '' : undefined}
			onpointerdown={(e) => slotDown(e, i)}
			onpointermove={slotMove}
			onpointerup={release}
			onpointercancel={release}
			onkeydown={(e) => slotKey(e, i)}
			class={cn(
				'absolute touch-none outline-offset-3 outline-primary focus-visible:outline-3 data-active:outline-3',
				photos[i] && edit.slots[i].zoom > ZOOM.min ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
				move &&
					i !== move.from &&
					photos[i] &&
					(move.target === i
						? 'bg-paper/25 outline-3 outline-paper'
						: 'cursor-pointer outline-2 outline-paper/70 outline-dashed')
			)}
			style:left="{box.x}%"
			style:top="{box.y}%"
			style:width="{box.w}%"
			style:height="{box.h}%"
		></button>
	{/each}

	{#each edit.items as it (it.id)}
		{@const on = item === it.id}

		<div
			class="absolute -translate-1/2"
			style:left="{it.x}%"
			style:top="{it.y}%"
			style:width={it.kind === 'sticker' ? `${it.size}%` : undefined}
		>
			<button
				type="button"
				aria-label={it.kind === 'text'
					? it.text
					: isStickerId(it.sticker)
						? STICKER_LABELS[it.sticker]()
						: m['session.edit.sticker_upload']()}
				aria-pressed={on}
				onpointerdown={(e) => itemDown(e, it)}
				onpointermove={(e) => itemMove(e, it)}
				onpointerup={release}
				onpointercancel={release}
				onkeydown={(e) => itemKey(e, it)}
				class="block w-full cursor-move touch-none outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary aria-pressed:shadow-[0_0_0_1px_rgba(14,14,13,0.55)] aria-pressed:outline-2 aria-pressed:outline-paper aria-pressed:outline-dashed"
			>
				{#if it.kind === 'sticker'}
					<img src={stickerSrc(it.sticker)} alt="" draggable="false" class="block w-full" />
				{:else}
					<span
						class={cn('block leading-none whitespace-pre', fonts[it.font])}
						style:color={it.color}
						style:font-size="{(it.size * width) / 100}px"
					>
						{it.text}
					</span>
				{/if}
			</button>

			{#if on && tool !== 'brush'}
				<button
					type="button"
					aria-label={m['session.edit.remove']()}
					onclick={() => remove(it)}
					class="{handle} -top-3.5 -right-3.5 bg-primary text-primary-foreground"
				>
					<RiCloseLine aria-hidden="true" class="size-3.5" />
				</button>

				<button
					type="button"
					aria-label={m['session.edit.resize']()}
					tabindex={-1}
					onpointerdown={(e) => resizeDown(e, it)}
					onpointermove={(e) => resizeMove(e, it)}
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
		{@const n = slot}

		<button
			type="button"
			aria-label={m['session.edit.move']({ n: n + 1 })}
			aria-pressed={move?.from === n}
			onpointerdown={(e) => handleDown(e, n)}
			onpointermove={handleMove}
			onpointerup={handleUp}
			onpointercancel={handleCancel}
			onclick={(e) => handleClick(e, n)}
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
			style:width="{box.w * 0.6}%"
			style:height="{box.h * 0.6}%"
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
