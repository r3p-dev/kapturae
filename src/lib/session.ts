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

export type FrameSlot = { x: number; y: number; w: number; h: number }

export type Frame = {
	id: string
	name: string
	size: PrintSize
	src: string
	color: string
	ink: string
	slots: FrameSlot[]
}

export const INK = { light: '#f4f2ee', dark: '#0e0e0d' }

export function inkOn([r, g, b]: number[]) {
	return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5 ? INK.dark : INK.light
}

export function pick<T extends string>(list: readonly T[], value: string | null): T | undefined {
	return list.find((item) => item === value)
}
