export const TOOLS = ['adjust', 'filter', 'sticker', 'text', 'brush', 'color'] as const

export type Tool = (typeof TOOLS)[number]

export const ZOOM = { min: 100, max: 250, step: 5 } as const

export const ADJUSTMENTS = ['brightness', 'contrast', 'saturation', 'warmth', 'grain'] as const

export type Adjustment = (typeof ADJUSTMENTS)[number]

export type SlotEdit = Record<Adjustment, number> & {
	zoom: number
	x: number
	y: number
	filter: FilterId
	intensity: number
}

export const FONTS = ['bold', 'mono', 'serif'] as const

export type Font = (typeof FONTS)[number]

export type Item = { id: number; x: number; y: number; size: number } & (
	{ kind: 'sticker'; sticker: string } | { kind: 'text'; text: string; font: Font; color: string }
)

export const ITEM_SIZE = {
	sticker: { min: 8, max: 60, initial: 22 },
	text: { min: 4, max: 24, initial: 9 }
} as const

export type Stroke = { color: string; width: number; points: number[] }

export type Edit = {
	color: string | null
	order: number[]
	slots: SlotEdit[]
	items: Item[]
	strokes: Stroke[]
}

type Step = [fn: string, full: number, none: number, unit?: string]

type Preset = { steps: Step[]; tint?: [color: string, opacity: number] }

export const FILTERS = {
	original: { steps: [] },
	mono: {
		steps: [
			['grayscale', 1, 0],
			['contrast', 1.1, 1]
		]
	},
	noir: {
		steps: [
			['grayscale', 1, 0],
			['contrast', 1.4, 1],
			['brightness', 0.92, 1]
		]
	},
	warm: {
		steps: [
			['sepia', 0.45, 0],
			['saturate', 1.3, 1]
		]
	},
	golden: {
		steps: [
			['sepia', 0.2, 0],
			['saturate', 1.4, 1],
			['brightness', 1.05, 1]
		],
		tint: ['#ffb347', 0.3]
	},
	film: {
		steps: [
			['contrast', 1.12, 1],
			['sepia', 0.25, 0],
			['hue-rotate', -12, 0, 'deg']
		]
	},
	vintage: {
		steps: [
			['sepia', 0.55, 0],
			['contrast', 0.9, 1],
			['brightness', 1.06, 1],
			['saturate', 0.85, 1]
		]
	},
	faded: {
		steps: [
			['contrast', 0.8, 1],
			['brightness', 1.12, 1],
			['saturate', 0.8, 1]
		]
	},
	dreamy: {
		steps: [
			['brightness', 1.1, 1],
			['contrast', 0.85, 1],
			['saturate', 1.15, 1]
		],
		tint: ['#ffb3d1', 0.3]
	},
	cool: {
		steps: [
			['contrast', 1.05, 1],
			['saturate', 1.05, 1]
		],
		tint: ['#3c7dff', 0.35]
	},
	vivid: {
		steps: [
			['saturate', 1.6, 1],
			['contrast', 1.1, 1]
		]
	},
	punchy: {
		steps: [
			['contrast', 1.45, 1],
			['saturate', 1.1, 1]
		]
	}
} satisfies Record<string, Preset>

export type FilterId = keyof typeof FILTERS

export const FILTER_IDS = Object.keys(FILTERS) as FilterId[]

export const FRAME_COLORS = {
	green: '#1f4d36',
	red: '#8e1b12',
	black: '#141413',
	cream: '#f4f2ee',
	gold: '#c9962e',
	navy: '#1b2e55',
	pink: '#e7b7c8',
	brown: '#6b4a33',
	purple: '#4b3a78',
	white: '#ffffff'
} as const

export const SWATCHES = {
	white: '#f4f2ee',
	black: '#0e0e0d',
	red: '#c8281a',
	yellow: '#e8b23a',
	blue: '#1f5fbf'
} as const

export const blankSlot = (): SlotEdit => ({
	zoom: ZOOM.min,
	x: 0,
	y: 0,
	filter: 'original',
	intensity: 100,
	brightness: 0,
	contrast: 0,
	saturation: 0,
	warmth: 0,
	grain: 0
})

export const blankEdit = (slots: number): Edit => ({
	color: null,
	order: Array.from({ length: slots }, (_, i) => i),
	slots: Array.from({ length: slots }, blankSlot),
	items: [],
	strokes: []
})

export const GRAIN = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>'
)}`

export const FILTER_KEYS = ['filter', 'intensity'] as const

export const isFiltered = (slot: SlotEdit) =>
	(slot.filter !== 'original' && slot.intensity > 0) || ADJUSTMENTS.some((key) => slot[key] !== 0)

export function filterCss(filter: FilterId, intensity: number, slot?: SlotEdit) {
	const k = intensity / 100
	const preset = (FILTERS[filter] as Preset).steps.map(
		([fn, full, none, unit = '']) => `${fn}(${none + (full - none) * k}${unit})`
	)
	const own = slot
		? [
				`brightness(${1 + slot.brightness / 200})`,
				`contrast(${1 + slot.contrast / 200})`,
				`saturate(${1 + slot.saturation / 100})`
			]
		: []

	return [...preset, ...own].join(' ') || 'none'
}

export function filterTint(filter: FilterId, intensity: number) {
	const tint = (FILTERS[filter] as Preset).tint
	return tint && intensity ? { color: tint[0], opacity: tint[1] * (intensity / 100) } : null
}

export function panTransform({ zoom, x, y }: SlotEdit) {
	const z = zoom / 100
	const t = (v: number) => ((v * (z - 1)) / (2 * z)) * 100
	return `scale(${z}) translate(${t(x)}%, ${t(y)}%)`
}

export function panOffset({ zoom, x, y }: SlotEdit) {
	const z = zoom / 100
	return { zoom: z, dx: (x * (z - 1)) / 2, dy: (y * (z - 1)) / 2 }
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export class History<T> {
	value = $state() as T
	#past = $state<string[]>([])
	#future = $state<string[]>([])
	#base: string

	constructor(initial: T) {
		this.value = initial
		this.#base = JSON.stringify(initial)
	}

	get canUndo() {
		return this.#past.length > 0
	}

	get canRedo() {
		return this.#future.length > 0
	}

	commit() {
		const now = JSON.stringify(this.value)
		if (now === this.#base) return
		this.#past.push(this.#base)
		this.#future = []
		this.#base = now
	}

	undo() {
		this.commit()
		this.#step(this.#past, this.#future)
	}

	redo() {
		this.#step(this.#future, this.#past)
	}

	#step(from: string[], to: string[]) {
		const next = from.pop()
		if (next === undefined) return
		to.push(this.#base)
		this.#base = next
		this.value = JSON.parse(next)
	}
}
