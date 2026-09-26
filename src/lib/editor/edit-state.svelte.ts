import { browser } from '$app/environment'
import { UploadRejected, importPhoto, type UploadProblem } from '$lib/capture/upload'
import type StickerPrepComponent from '$lib/components/organisms/sticker-prep.svelte'
import {
	ADJUSTMENTS,
	FILTER_KEYS,
	History,
	ITEM_SIZE,
	SWATCHES,
	ZOOM,
	blankEdit,
	clamp,
	type Adjustment,
	type Edit,
	type Font,
	type Item,
	type SlotEdit,
	type Tool
} from '$lib/editor/editor.svelte'
import { recolor } from '$lib/frames/recolor'
import { frameQuery } from '$lib/frames/requested'
import { m } from '$lib/paraglide/messages'
import { localizeHref } from '$lib/paraglide/runtime'
import type { Frame } from '$lib/session/session'
import { addPhoto, photoFor, shots, useShots } from '$lib/session/shots.svelte'

type Draft<T> = T extends unknown ? Omit<T, 'id'> : never

export type Brush = { color: string; size: number; isEraser: boolean }
export type Move = { from: number; target: number }
export type ReplaceMode = 'camera' | 'upload'

export const ZOOM_BUTTON_STEP = 10

const RECOLOR_DELAY = 60

export class EditState {
	frame: Frame
	total: number
	query: string
	done: string
	history: History<Edit>

	tool = $state<Tool | null>('color')
	slot = $state<number | null>(null)
	item = $state<number | null>(null)
	move = $state<Move | null>(null)
	shouldApplyAll = $state(false)
	brush = $state<Brush>({ color: SWATCHES.white, size: 8, isEraser: false })
	draft = $state({ text: '', font: 'bold' as Font, color: SWATCHES.white as string })
	src = $state('')
	replace = $state<ReplaceMode | null>(null)
	isSheetOpen = $state(false)
	isReplacing = $state(false)
	replaceProblem = $state<UploadProblem | null>(null)
	hasUploadFailed = $state(false)
	stickerFiles = $state<File[]>([])
	StickerPrep = $state<typeof StickerPrepComponent | null>(null)

	edit = $derived.by(() => this.history.value)
	shown = $derived.by(() => ({ ...this.frame, src: this.src }))
	photos = $derived(this.edit.order.map((shot) => shots.photos[shot]))
	current = $derived(this.slot === null ? undefined : this.edit.slots[this.slot])
	look = $derived(
		this.current ??
			(this.edit.slots.every(
				(slotEdit) =>
					slotEdit.filter === this.edit.slots[0].filter && slotEdit.intensity === this.edit.slots[0].intensity
			)
				? this.edit.slots[0]
				: undefined)
	)
	hasPhoto = $derived(this.slot !== null && Boolean(this.photos[this.slot]))
	preview = $derived((this.slot !== null && this.photos[this.slot]) || this.photos.find(Boolean))
	isMissingPhotos = $derived(this.photos.some((photo) => !photo))
	slotPhoto = $derived(this.slot === null ? undefined : photoFor(this.photos[this.slot]))
	isReplacingSlot = $derived(this.slot !== null && this.replace !== null && !this.tool)
	selected = $derived(this.edit.items.find((entry) => entry.id === this.item))
	text = $derived(this.selected?.kind === 'text' ? this.selected : undefined)
	sticker = $derived(this.selected?.kind === 'sticker' ? this.selected : undefined)

	hint = $derived.by(() => {
		if (this.move) {
			return m['session.edit.hint_move']()
		}

		if (this.isMissingPhotos) {
			return m['session.edit.hint_missing']()
		}

		if (this.tool === 'brush') {
			return this.brush.isEraser ? m['session.edit.hint_eraser']() : m['session.edit.hint_brush']()
		}

		if (this.selected) {
			return m['session.edit.hint_item']()
		}

		return null
	})

	constructor(frame: Frame) {
		this.frame = frame
		this.total = frame.slots.length
		this.query = frameQuery(frame)
		this.done = localizeHref(`/session/done?${this.query}`)
		this.src = frame.src

		if (browser) {
			useShots(frame.size, frame.id)
		}

		this.history = new History<Edit>(shots.edit ?? blankEdit(this.total))

		$effect(() => {
			shots.edit = $state.snapshot(this.history.value)
		})

		const empty = this.history.value.order.findIndex((shot) => !shots.photos[shot])
		this.slot = empty === -1 ? null : empty

		$effect(() => {
			const color = this.edit.color
			if (!color) {
				this.src = frame.src
				return
			}

			let isLive = true
			const timer = setTimeout(() => {
				recolor(frame, color)
					.then((url) => isLive && (this.src = url))
					.catch(() => {})
			}, RECOLOR_DELAY)

			return () => {
				isLive = false
				clearTimeout(timer)
			}
		})
	}

	commit() {
		this.history.commit()
	}

	shootHref(index: number) {
		return localizeHref(`/session/shoot?${this.query}&retake=${this.edit.order[index]}`)
	}

	place(target: number, url: string) {
		const from = this.edit.order.findIndex((shot) => shots.photos[shot] === url)
		if (from === target) {
			return
		}

		if (from === -1) {
			shots.photos[this.edit.order[target]] = url
			Object.assign(this.edit.slots[target], { zoom: ZOOM.min, x: 0, y: 0 })
		} else {
			const { order, slots } = this.edit
			;[order[from], order[target]] = [order[target], order[from]]
			;[slots[from], slots[target]] = [slots[target], slots[from]]
		}

		this.commit()
	}

	async replaceWith(files: File[]) {
		const target = this.slot
		const [file] = files
		if (target === null || !file || this.isReplacing) {
			return
		}

		this.isReplacing = true
		this.replaceProblem = null
		try {
			const url = await importPhoto(file)
			this.place(target, addPhoto({ url, source: 'upload', name: file.name, burst: [] }))
			this.isSheetOpen = false
		} catch (error) {
			this.replaceProblem = error instanceof UploadRejected ? error.problem : 'unreadable'
		} finally {
			this.isReplacing = false
		}
	}

	openReplace(mode: ReplaceMode) {
		this.replace = mode
		this.replaceProblem = null
		this.tool = null
	}

	openSheet() {
		this.replaceProblem = null
		this.isSheetOpen = true
	}

	pickTool(next: Tool | null) {
		this.replace = null
		this.tool = next === this.tool ? null : next
		if (this.selected && this.selected.kind !== this.tool) {
			this.item = null
		}
	}

	setAdjustment(key: Adjustment, value: number) {
		if (!this.current) {
			return
		}

		for (const target of this.shouldApplyAll ? this.edit.slots : [this.current]) {
			target[key] = value
		}
	}

	setLook<K extends (typeof FILTER_KEYS)[number]>(key: K, value: SlotEdit[K]) {
		for (const target of this.shouldApplyAll || !this.current ? this.edit.slots : [this.current]) {
			target[key] = value
		}
	}

	setApplyAll(isOn: boolean) {
		this.shouldApplyAll = isOn
		const { current } = this
		if (!isOn || !current) {
			return
		}

		const keys: readonly (keyof SlotEdit)[] = this.tool === 'filter' ? FILTER_KEYS : ADJUSTMENTS
		for (const target of this.edit.slots) {
			for (const key of keys) {
				Object.assign(target, { [key]: current[key] })
			}
		}
		this.commit()
	}

	zoomBy(step: number) {
		if (!this.current) {
			return
		}

		this.current.zoom = clamp(this.current.zoom + step, ZOOM.min, ZOOM.max)
		this.commit()
	}

	addItem(next: Draft<Item>) {
		const id = Math.max(0, ...this.edit.items.map((entry) => entry.id)) + 1
		this.edit.items.push({ ...next, id } as Item)
		this.item = id
		this.commit()
	}

	removeItem() {
		this.edit.items = this.edit.items.filter((entry) => entry.id !== this.item)
		this.item = null
		this.commit()
	}

	addText() {
		const value = this.draft.text.trim() || m['session.edit.text_placeholder']()
		this.addItem({
			kind: 'text',
			text: value,
			font: this.draft.font,
			color: this.draft.color,
			x: 50,
			y: 50,
			size: ITEM_SIZE.text.initial
		})
		this.draft.text = ''
	}

	addSticker(stickerSource: string) {
		this.addItem({ kind: 'sticker', sticker: stickerSource, x: 50, y: 50, size: ITEM_SIZE.sticker.initial })
	}

	async importStickers(files: File[]) {
		this.hasUploadFailed = false
		if (!files.length) {
			return
		}

		try {
			const module = await import('$lib/components/organisms/sticker-prep.svelte')
			this.StickerPrep = module.default
			this.stickerFiles = files
		} catch {
			this.hasUploadFailed = true
		}
	}

	keepSticker(url: string) {
		shots.uploads.push(url)
		this.addSticker(url)
	}

	setTextStyle(style: Partial<Pick<EditState['draft'], 'font' | 'color'>>) {
		Object.assign(this.draft, style)
		if (this.text) {
			Object.assign(this.text, style)
		}
	}

	keydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !(event.target as HTMLElement).closest('input, textarea')) {
			if (this.move) {
				this.move = null
			} else if (this.item !== null || this.slot !== null) {
				this.item = null
				this.slot = null
			} else {
				return
			}

			event.preventDefault()
			return
		}

		if (!(event.ctrlKey || event.metaKey)) {
			return
		}

		const key = event.key.toLowerCase()
		if (key !== 'z' && key !== 'y') {
			return
		}

		if ((event.target as HTMLElement).closest('input, textarea')) {
			return
		}

		event.preventDefault()
		if (key === 'y' || event.shiftKey) {
			this.history.redo()
		} else {
			this.history.undo()
		}
	}
}
