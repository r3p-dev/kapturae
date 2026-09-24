import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { PNG } from 'pngjs'
import type { Plugin } from 'vite'
import { PRINT_SIZES, type Frame, type FrameSlot, type PrintSize } from '../src/lib/session.ts'

const DIR = resolve('static/frames')
const ID = 'virtual:frames'
const RESOLVED = `\0${ID}`

const ALPHA = 128
const MIN_PIECE = 0.0005
const MIN_SLOT = 0.01
const MERGE_OVERLAP = 0.25
const ROW = 0.05

const INK = { light: '#f4f2ee', dark: '#0e0e0d' }

type Box = { x0: number; y0: number; x1: number; y1: number }

const overlap = (a: Box, b: Box) => {
	const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
	const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
	const area = (box: Box) => (box.x1 - box.x0) * (box.y1 - box.y0)
	return w > 0 && h > 0 ? (w * h) / Math.min(area(a), area(b)) : 0
}

function holes({ width, height, data }: PNG) {
	const seen = new Uint8Array(width * height)
	const stack = new Int32Array(width * height)
	const found: (Box & { area: number })[] = []
	const open = (p: number) => !seen[p] && data[p * 4 + 3] < ALPHA

	for (let start = 0; start < seen.length; start++) {
		if (!open(start)) continue

		const box = { x0: width, y0: height, x1: 0, y1: 0, area: 0 }
		let top = 0
		stack[top++] = start
		seen[start] = 1

		while (top) {
			const p = stack[--top]
			const x = p % width
			const y = (p - x) / width
			box.area++
			box.x0 = Math.min(box.x0, x)
			box.y0 = Math.min(box.y0, y)
			box.x1 = Math.max(box.x1, x + 1)
			box.y1 = Math.max(box.y1, y + 1)

			for (const q of [
				x > 0 && p - 1,
				x < width - 1 && p + 1,
				y > 0 && p - width,
				y < height - 1 && p + width
			]) {
				if (q !== false && open(q)) {
					seen[q] = 1
					stack[top++] = q
				}
			}
		}

		found.push(box)
	}

	return found
}

function slots(png: PNG): FrameSlot[] {
	const { width, height } = png
	const total = width * height

	const boxes = holes(png).filter(
		(box) =>
			box.area >= total * MIN_PIECE &&
			!(box.x1 - box.x0 >= width * 0.9 && box.y1 - box.y0 >= height * 0.9)
	)

	for (let merged = true; merged;) {
		merged = false
		for (let i = 0; i < boxes.length && !merged; i++) {
			for (let j = i + 1; j < boxes.length && !merged; j++) {
				const [a, b] = [boxes[i], boxes[j]]
				if (overlap(a, b) < MERGE_OVERLAP) continue
				boxes[i] = {
					x0: Math.min(a.x0, b.x0),
					y0: Math.min(a.y0, b.y0),
					x1: Math.max(a.x1, b.x1),
					y1: Math.max(a.y1, b.y1),
					area: a.area + b.area
				}
				boxes.splice(j, 1)
				merged = true
			}
		}
	}

	const pct = (n: number, of: number) => Math.round((n / of) * 10000) / 100
	return boxes
		.filter((box) => box.area >= total * MIN_SLOT)
		.sort((a, b) => (Math.abs(a.y0 - b.y0) < height * ROW ? a.x0 - b.x0 : a.y0 - b.y0))
		.map((box) => ({
			x: pct(box.x0, width),
			y: pct(box.y0, height),
			w: pct(box.x1 - box.x0, width),
			h: pct(box.y1 - box.y0, height)
		}))
}

function baseColor({ data }: PNG) {
	const counts = new Uint32Array(1 << 15)
	const sums = new Float64Array((1 << 15) * 3)

	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] < 255) continue
		const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3)
		counts[key]++
		sums[key * 3] += data[i]
		sums[key * 3 + 1] += data[i + 1]
		sums[key * 3 + 2] += data[i + 2]
	}

	const key = counts.reduce((best, count, k) => (count > counts[best] ? k : best), 0)
	const rgb = [0, 1, 2].map((c) => Math.round(sums[key * 3 + c] / Math.max(counts[key], 1)))
	const [r, g, b] = rgb.map((v) => v / 255)

	return {
		color: `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`,
		ink: 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5 ? INK.dark : INK.light
	}
}

const titleCase = (file: string) =>
	file
		.replace(/\.png$/i, '')
		.replace(/[-_]+/g, ' ')
		.trim()
		.replace(/(^|\s)\S/g, (c) => c.toUpperCase())

const slug = (text: string) =>
	text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')

export function frames(): Plugin {
	const cache = new Map<string, { mtime: number; frame: Frame | undefined }>()

	function read(size: PrintSize, file: string, warn: (message: string) => void) {
		const path = join(DIR, size, file)
		const { mtimeMs } = statSync(path)
		const hit = cache.get(path)
		if (hit?.mtime === mtimeMs) return hit.frame

		let frame: Frame | undefined
		try {
			const png = PNG.sync.read(readFileSync(path))
			const found = slots(png)
			if (found.length) {
				frame = {
					id: `${size}-${slug(file.replace(/\.png$/i, ''))}`,
					name: titleCase(file),
					size,
					src: `/frames/${size}/${encodeURIComponent(file)}`,
					...baseColor(png),
					slots: found
				}
			} else {
				warn(`${size}/${file}: no transparent photo slots found, skipping`)
			}
		} catch (error) {
			warn(`${size}/${file}: couldn't read PNG (${(error as Error).message}), skipping`)
		}

		cache.set(path, { mtime: mtimeMs, frame })
		return frame
	}

	function scan(warn: (message: string) => void) {
		const folders = new Set(readdirSync(DIR))
		for (const folder of folders) {
			if (!PRINT_SIZES.includes(folder as PrintSize))
				warn(`frames/${folder}: not a print size, skipping`)
		}

		return PRINT_SIZES.filter((size) => folders.has(size)).flatMap((size) =>
			readdirSync(join(DIR, size))
				.filter((file) => /\.png$/i.test(file))
				.sort()
				.flatMap((file) => read(size, file, warn) ?? [])
		)
	}

	return {
		name: 'kapturae-frames',

		resolveId: (id) => (id === ID ? RESOLVED : undefined),

		load(id) {
			if (id !== RESOLVED) return
			return `export default ${JSON.stringify(scan((message) => this.warn(message)))}`
		},

		configureServer(server) {
			server.watcher.add(DIR)

			const reload = (path: string) => {
				if (!path.startsWith(DIR)) return
				for (const environment of Object.values(server.environments)) {
					const module = environment.moduleGraph.getModuleById(RESOLVED)
					if (module) environment.moduleGraph.invalidateModule(module)
				}
				server.ws.send({ type: 'full-reload' })
			}

			server.watcher.on('add', reload).on('change', reload).on('unlink', reload)
		}
	}
}
