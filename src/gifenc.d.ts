declare module 'gifenc' {
	export type Palette = number[][]

	export type GifFormat = 'rgb565' | 'rgb444' | 'rgba4444'

	export interface GifEncoder {
		writeFrame(index: Uint8Array, width: number, height: number, options: { palette: Palette; delay: number }): void
		finish(): void
		bytesView(): Uint8Array
	}

	export function GIFEncoder(): GifEncoder

	export function quantize(
		data: Uint8Array | Uint8ClampedArray,
		maxColors: number,
		options?: { format?: GifFormat }
	): Palette

	export function applyPalette(data: Uint8Array | Uint8ClampedArray, palette: Palette, format?: GifFormat): Uint8Array
}
