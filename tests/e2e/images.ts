import { PNG } from 'pngjs'

type Rgb = [number, number, number]

export function png(width: number, height: number, paint: (x: number, y: number) => Rgb) {
	const image = new PNG({ width, height })
	for (const index of new Uint8Array(width * height).keys()) {
		const x = index % width
		const y = (index - x) / width
		image.data.set([...paint(x, y), 255], index * 4)
	}
	return PNG.sync.write(image)
}

export function photo(seed: number) {
	return png(800, 800, (x, y) => [(x + seed * 40) % 256, (y * 2) % 256, (seed * 70) % 256])
}

export function stickerOnWhite() {
	return png(300, 300, (x, y) => (x > 90 && x < 210 && y > 90 && y < 210 ? [200, 30, 20] : [250, 250, 248]))
}
