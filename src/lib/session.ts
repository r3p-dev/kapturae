export const SESSION_STEPS = ['frame', 'shoot', 'edit', 'done'] as const

export type SessionStep = (typeof SESSION_STEPS)[number]

export const PRINT_SIZES = ['2x6', '4x6', '5x7'] as const

export type PrintSize = (typeof PRINT_SIZES)[number]

export type SizeSpec = {
	label: string
	cm: string
	shots: number
	ratio: number
	pad: number
	padBottom: number
	cols: string
	rows: string
	slots: string[]
}

export const SIZES: Record<PrintSize, SizeSpec> = {
	'2x6': {
		label: '2×6"',
		cm: '5 × 15 cm',
		shots: 4,
		ratio: 1 / 3,
		pad: 0.08,
		padBottom: 0.11,
		cols: '1fr',
		rows: 'repeat(4, 1fr)',
		slots: ['auto', 'auto', 'auto', 'auto']
	},
	'4x6': {
		label: '4×6"',
		cm: '10 × 15 cm',
		shots: 4,
		ratio: 2 / 3,
		pad: 0.05,
		padBottom: 0.15,
		cols: '1fr 1fr',
		rows: '1fr 1fr',
		slots: ['auto', 'auto', 'auto', 'auto']
	},
	'5x7': {
		label: '5×7"',
		cm: '13 × 18 cm',
		shots: 3,
		ratio: 5 / 7,
		pad: 0.05,
		padBottom: 0.15,
		cols: '1fr 1fr',
		rows: '2fr 1fr',
		slots: ['1 / 1 / 2 / 3', '2 / 1', '2 / 2']
	}
}

export const FRAME_DESIGNS = [
	'classic',
	'film',
	'christmas',
	'birthday',
	'lines',
	'accent'
] as const

export type FrameDesign = (typeof FRAME_DESIGNS)[number]

export type DesignSpec = {
	bg: string
	pattern?: string
	patternSize?: string
	slot: string
	ink: string
}

export const DESIGNS: Record<FrameDesign, DesignSpec> = {
	classic: { bg: '#f4f2ee', slot: '#5e5c57', ink: '#0e0e0d' },
	film: { bg: '#1b1b19', slot: '#4a4945', ink: '#f4f2ee' },
	christmas: {
		bg: '#1f4d36',
		pattern: 'radial-gradient(rgb(244 242 238 / 0.85) 1px, transparent 1.6px)',
		patternSize: '9px 9px',
		slot: '#5e5c57',
		ink: '#f4f2ee'
	},
	birthday: {
		bg: '#e8b23a',
		pattern: 'radial-gradient(#c8281a 1.4px, transparent 2px)',
		patternSize: '11px 11px',
		slot: '#5e5c57',
		ink: '#0e0e0d'
	},
	lines: {
		bg: '#ffffff',
		pattern: 'repeating-linear-gradient(0deg, transparent 0 8px, #e6e2da 8px 9px)',
		slot: '#5e5c57',
		ink: '#0e0e0d'
	},
	accent: { bg: 'var(--primary)', slot: '#f4f2ee', ink: '#ffffff' }
}

export const FRAME_ASSETS: string[] = []

export function pick<T extends string>(list: readonly T[], value: string | null): T | undefined {
	return list.find((item) => item === value)
}
