import { SvelteMap } from 'svelte/reactivity'
import type { EditState } from '$lib/editor/edit-state.svelte'
import { ITEM_SIZE, ZOOM, clamp, panReach, type Item, type Stroke } from '$lib/editor/editor.svelte'

const PAN_STEP = 0.1
const MIN_STEP = 0.4
const DRAG_SLOP = 4

type Carry = { id: number; x: number; y: number; hasTravelled: boolean; isPicking: boolean }
type Resize = { id: number; centerX: number; centerY: number; distance: number; size: number }

export class StageGestures {
	editor: EditState
	stage = $state<HTMLDivElement>()
	width = $state(0)
	ghost = $state<{ x: number; y: number } | null>(null)
	aspects = new SvelteMap<string, number>()

	percentPerPixel = $derived(this.width ? 100 / this.width : 0)

	#pointers = new SvelteMap<number, { x: number; y: number }>()
	#pinch: { distance: number; zoom: number } | null = null
	#stroke: Stroke | null = null
	#isErasing = false
	#carry: Carry | null = null
	#resize: Resize | null = null

	constructor(editor: EditState) {
		this.editor = editor
	}

	stageDown(event: PointerEvent) {
		if ((event.target as Element).closest('button')) {
			return
		}

		this.editor.slot = null
		this.editor.item = null
		this.editor.move = null
	}

	release(event: PointerEvent) {
		if (!this.#pointers.delete(event.pointerId)) {
			return
		}

		this.#pinch = null
		this.#stroke = null
		this.#isErasing = false

		if (!this.#pointers.size) {
			this.editor.commit()
		}
	}

	pannable(index: number) {
		const reach = this.#reachOf(index)
		return reach.x > 0.5 || reach.y > 0.5
	}

	slotDown(event: PointerEvent, index: number) {
		const { editor } = this
		if (editor.move && !this.#pointers.size) {
			if (index !== editor.move.from && editor.photos[index]) {
				return this.#swap(editor.move.from, index)
			}

			editor.move = null
		}

		if (!this.#pointers.size) {
			editor.slot = index
			editor.item = null
		}

		if (editor.slot === null || !editor.photos[editor.slot]) {
			return
		}

		this.#grab(event)

		if (this.#pointers.size === 2) {
			this.#pinch = { distance: this.#spread(), zoom: editor.edit.slots[editor.slot].zoom }
		}
	}

	slotMove(event: PointerEvent) {
		const movement = this.#delta(event)
		const { slot } = this.editor
		if (!movement || !this.stage || slot === null) {
			return
		}

		const slotEdit = this.editor.edit.slots[slot]

		if (this.#pinch && this.#pointers.size === 2) {
			slotEdit.zoom = clamp(Math.round((this.#pinch.zoom * this.#spread()) / this.#pinch.distance), ZOOM.min, ZOOM.max)
			return
		}

		const reach = this.#reachOf(slot)
		if (reach.x > 0.5) {
			slotEdit.x = clamp(slotEdit.x + movement.x / reach.x, -1, 1)
		}

		if (reach.y > 0.5) {
			slotEdit.y = clamp(slotEdit.y + movement.y / reach.y, -1, 1)
		}
	}

	slotKey(event: KeyboardEvent, index: number) {
		const slotEdit = this.editor.edit.slots[index]
		const pan = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]

		if (pan && this.pannable(index)) {
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
		this.editor.commit()
	}

	handleDown(event: PointerEvent, index: number) {
		if (this.#carry) {
			return
		}

		;(event.currentTarget as Element).setPointerCapture(event.pointerId)
		this.#carry = {
			id: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			hasTravelled: false,
			isPicking: this.editor.move !== null
		}
		this.editor.move = { from: index, target: index }
	}

	handleMove(event: PointerEvent) {
		const carry = this.#carry
		const { move } = this.editor
		if (carry?.id !== event.pointerId || !move) {
			return
		}

		if (!carry.hasTravelled && Math.hypot(event.clientX - carry.x, event.clientY - carry.y) < DRAG_SLOP) {
			return
		}

		carry.hasTravelled = true
		const box = this.stage!.getBoundingClientRect()
		this.ghost = {
			x: ((event.clientX - box.left) / box.width) * 100,
			y: ((event.clientY - box.top) / box.height) * 100
		}
		move.target = this.#slotAt(event) ?? move.from
	}

	handleUp(event: PointerEvent) {
		const { move } = this.editor
		if (this.#carry?.id !== event.pointerId || !move) {
			return
		}

		const { hasTravelled, isPicking } = this.#carry
		this.#carry = null
		this.ghost = null
		const dropSlot = hasTravelled ? this.#slotAt(event) : null

		if (dropSlot !== null) {
			this.#swap(move.from, dropSlot)
		} else if (hasTravelled || isPicking) {
			this.editor.move = null
		}
	}

	handleCancel() {
		this.#carry = null
		this.ghost = null
		this.editor.move = null
	}

	handleClick(event: MouseEvent, index: number) {
		if (event.detail) {
			return
		}

		const { move } = this.editor
		if (!move) {
			this.editor.move = { from: index, target: index }
		} else if (move.target !== move.from) {
			this.#swap(move.from, move.target)
		} else {
			this.editor.move = null
		}
	}

	handleKey(event: KeyboardEvent) {
		const { move, photos } = this.editor
		if (!move) {
			return
		}

		const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key]
		if (!step) {
			return
		}

		event.preventDefault()
		const count = this.editor.frame.slots.length
		let next = move.target

		do {
			next = (next + step + count) % count
		} while ((next === move.from || !photos[next]) && next !== move.target)
		move.target = next
	}

	itemDown(event: PointerEvent, entry: Item) {
		this.editor.item = entry.id
		this.editor.move = null
		this.editor.tool = entry.kind
		this.#grab(event)
	}

	itemMove(event: PointerEvent, entry: Item) {
		const movement = this.#delta(event)
		if (!movement || !this.stage) {
			return
		}

		const box = this.stage.getBoundingClientRect()
		if (!box.width || !box.height) {
			return
		}

		entry.x = clamp(entry.x + (movement.x / box.width) * 100, 0, 100)
		entry.y = clamp(entry.y + (movement.y / box.height) * 100, 0, 100)
	}

	remove(entry: Item) {
		const { edit } = this.editor
		edit.items = edit.items.filter((other) => other.id !== entry.id)
		this.editor.item = null
		this.editor.commit()
	}

	resizeDown(event: PointerEvent, entry: Item) {
		const handle = event.currentTarget as Element
		const box = handle.parentElement!.getBoundingClientRect()
		const centerX = box.left + box.width / 2
		const centerY = box.top + box.height / 2
		handle.setPointerCapture(event.pointerId)
		this.#resize = {
			id: event.pointerId,
			centerX,
			centerY,
			distance: Math.max(1, Math.hypot(event.clientX - centerX, event.clientY - centerY)),
			size: entry.size
		}
	}

	resizeMove(event: PointerEvent, entry: Item) {
		const resize = this.#resize
		if (resize?.id !== event.pointerId) {
			return
		}

		const { min, max } = ITEM_SIZE[entry.kind]
		const scale = Math.hypot(event.clientX - resize.centerX, event.clientY - resize.centerY) / resize.distance
		entry.size = clamp(Math.round(resize.size * scale), min, max)
	}

	resizeUp(event: PointerEvent) {
		if (this.#resize?.id !== event.pointerId) {
			return
		}

		this.#resize = null
		this.editor.commit()
	}

	itemKey(event: KeyboardEvent, entry: Item) {
		const nudge = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]

		if (nudge) {
			entry.x = clamp(entry.x + nudge[0], 0, 100)
			entry.y = clamp(entry.y + nudge[1], 0, 100)
		} else if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault()
			return this.remove(entry)
		} else {
			return
		}

		event.preventDefault()
		this.editor.commit()
	}

	brushDown(event: PointerEvent) {
		if (this.#pointers.size) {
			return
		}

		this.#grab(event)
		const [x, y] = this.#point(event)
		const { brush, edit } = this.editor

		if (brush.isEraser) {
			this.#isErasing = true
			this.#erase([x, y])
			return
		}

		edit.strokes.push({ color: brush.color, width: brush.size * this.percentPerPixel, points: [x, y, x, y] })
		this.#stroke = edit.strokes[edit.strokes.length - 1]
	}

	brushMove(event: PointerEvent) {
		if (!this.#pointers.has(event.pointerId)) {
			return
		}

		const [x, y] = this.#point(event)

		if (this.#isErasing) {
			return this.#erase([x, y])
		}

		const stroke = this.#stroke
		if (!stroke) {
			return
		}

		const { length } = stroke.points
		if (Math.hypot(stroke.points[length - 2] - x, stroke.points[length - 1] - y) >= MIN_STEP) {
			stroke.points.push(x, y)
		}
	}

	#spread() {
		const [first, second] = [...this.#pointers.values()]
		return Math.hypot(first.x - second.x, first.y - second.y)
	}

	#grab(event: PointerEvent) {
		;(event.currentTarget as Element).setPointerCapture(event.pointerId)
		this.#pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
	}

	#delta(event: PointerEvent) {
		const last = this.#pointers.get(event.pointerId)
		if (!last) {
			return null
		}

		const movement = { x: event.clientX - last.x, y: event.clientY - last.y }
		last.x = event.clientX
		last.y = event.clientY
		return movement
	}

	#reachOf(index: number) {
		const box = this.editor.frame.slots[index]
		const rect = this.stage?.getBoundingClientRect()
		const stageWidth = rect?.width || this.stage?.clientWidth || 0
		const stageHeight = rect?.height || this.stage?.clientHeight || 0
		const boxWidth = (box.width / 100) * stageWidth
		const boxHeight = (box.height / 100) * stageHeight
		return panReach(
			this.editor.edit.slots[index],
			{ width: boxWidth, height: boxHeight },
			this.aspects.get(this.editor.photos[index]) ?? boxWidth / boxHeight
		)
	}

	#swap(from: number, to: number) {
		const { order, slots } = this.editor.edit
		;[order[from], order[to]] = [order[to], order[from]]
		;[slots[from], slots[to]] = [slots[to], slots[from]]
		this.editor.slot = to
		this.editor.item = null
		this.editor.move = null
		this.editor.commit()
	}

	#slotAt(event: PointerEvent) {
		const box = this.stage!.getBoundingClientRect()
		const x = ((event.clientX - box.left) / box.width) * 100
		const y = ((event.clientY - box.top) / box.height) * 100
		const index = this.editor.frame.slots.findIndex(
			(candidate) =>
				x >= candidate.x &&
				x <= candidate.x + candidate.width &&
				y >= candidate.y &&
				y <= candidate.y + candidate.height
		)

		return index !== -1 && index !== this.editor.move?.from && this.editor.photos[index] ? index : null
	}

	#point(event: PointerEvent) {
		const box = this.stage!.getBoundingClientRect()
		const scale = box.width ? 100 / box.width : this.percentPerPixel
		return [(event.clientX - box.left) * scale, (event.clientY - box.top) * scale]
	}

	#erase([x, y]: number[]) {
		const { brush, edit } = this.editor
		const reach = Math.max(3, brush.size * this.percentPerPixel)
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
}
