import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { PNG } from 'pngjs'
import type { Plugin } from 'vite'
import { PRINT_SIZES, inkOn, type Frame, type FrameSlot, type PrintSize } from '../src/lib/session/session.ts'

const FRAMES_DIRECTORY = resolve('static/frames')
const ID = 'virtual:frames'
const RESOLVED = `\0${ID}`

const ALPHA = 128
const MIN_PIECE = 0.0005
const MIN_SLOT = 0.01
const MERGE_OVERLAP = 0.25
const ROW = 0.05

type Box = { x0: number; y0: number; x1: number; y1: number }

function overlap(first: Box, second: Box) {
	const width = Math.min(first.x1, second.x1) - Math.max(first.x0, second.x0)
	const height = Math.min(first.y1, second.y1) - Math.max(first.y0, second.y0)

	function area(box: Box) {
		return (box.x1 - box.x0) * (box.y1 - box.y0)
	}

	return width > 0 && height > 0 ? (width * height) / Math.min(area(first), area(second)) : 0
}

function holes({ width, height, data }: PNG) {
	const seen = new Uint8Array(width * height)
	const stack = new Int32Array(width * height)
	const found: (Box & { area: number })[] = []

	function open(pixel: number) {
		return !seen[pixel] && data[pixel * 4 + 3] < ALPHA
	}

	for (const start of seen.keys()) {
		if (!open(start)) {
			continue
		}

		const box = { x0: width, y0: height, x1: 0, y1: 0, area: 0 }
		let top = 0
		stack[top++] = start
		seen[start] = 1

		while (top) {
			const pixel = stack[--top]
			const x = pixel % width
			const y = (pixel - x) / width

			box.area++
			box.x0 = Math.min(box.x0, x)
			box.y0 = Math.min(box.y0, y)
			box.x1 = Math.max(box.x1, x + 1)
			box.y1 = Math.max(box.y1, y + 1)

			const neighbours = [
				x > 0 && pixel - 1,
				x < width - 1 && pixel + 1,
				y > 0 && pixel - width,
				y < height - 1 && pixel + width
			]

			for (const neighbour of neighbours) {
				if (neighbour !== false && open(neighbour)) {
					seen[neighbour] = 1
					stack[top++] = neighbour
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
		(box) => box.area >= total * MIN_PIECE && !(box.x1 - box.x0 >= width * 0.9 && box.y1 - box.y0 >= height * 0.9)
	)

	let hasMerged = true
	while (hasMerged) {
		hasMerged = false
		for (const [index, first] of boxes.entries()) {
			const partnerIndex = boxes.findIndex(
				(other, otherIndex) => otherIndex > index && overlap(first, other) >= MERGE_OVERLAP
			)

			if (partnerIndex === -1) {
				continue
			}

			const second = boxes[partnerIndex]
			boxes[index] = {
				x0: Math.min(first.x0, second.x0),
				y0: Math.min(first.y0, second.y0),
				x1: Math.max(first.x1, second.x1),
				y1: Math.max(first.y1, second.y1),
				area: first.area + second.area
			}

			boxes.splice(partnerIndex, 1)
			hasMerged = true
			break
		}
	}

	function percent(value: number, of: number) {
		return Math.round((value / of) * 10000) / 100
	}

	return boxes
		.filter((box) => box.area >= total * MIN_SLOT)
		.sort((first, second) =>
			Math.abs(first.y0 - second.y0) < height * ROW ? first.x0 - second.x0 : first.y0 - second.y0
		)
		.map((box) => ({
			x: percent(box.x0, width),
			y: percent(box.y0, height),
			width: percent(box.x1 - box.x0, width),
			height: percent(box.y1 - box.y0, height)
		}))
}

function baseColor({ width, height, data }: PNG) {
	const counts = new Uint32Array(1 << 15)
	const sums = new Float64Array((1 << 15) * 3)

	for (const pixel of new Uint8Array(width * height).keys()) {
		const offset = pixel * 4
		if (data[offset + 3] < 255) {
			continue
		}

		const key = ((data[offset] >> 3) << 10) | ((data[offset + 1] >> 3) << 5) | (data[offset + 2] >> 3)

		counts[key]++
		sums[key * 3] += data[offset]
		sums[key * 3 + 1] += data[offset + 1]
		sums[key * 3 + 2] += data[offset + 2]
	}

	const key = counts.reduce((best, count, candidate) => (count > counts[best] ? candidate : best), 0)
	const rgb = [0, 1, 2].map((channel) => Math.round(sums[key * 3 + channel] / Math.max(counts[key], 1)))

	return {
		color: `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`,
		ink: inkOn(rgb)
	}
}

function titleCase(file: string) {
	return file
		.replace(/\.png$/i, '')
		.replace(/[-_]+/g, ' ')
		.trim()
		.replace(/(^|\s)\S/g, (character) => character.toUpperCase())
}

function slug(text: string) {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
}

export function frames(): Plugin {
	const cache = new Map<string, { mtime: number; frame: Frame | undefined }>()

	function read(size: PrintSize, file: string, warn: (message: string) => void) {
		const path = join(FRAMES_DIRECTORY, size, file)
		const { mtimeMs } = statSync(path)
		const hit = cache.get(path)

		if (hit?.mtime === mtimeMs) {
			return hit.frame
		}

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
			const reason = error instanceof Error ? error.message : String(error)
			warn(`${size}/${file}: couldn't read PNG (${reason}), skipping`)
		}

		cache.set(path, { mtime: mtimeMs, frame })
		return frame
	}

	function scan(warn: (message: string) => void) {
		const folders = new Set(readdirSync(FRAMES_DIRECTORY))
		for (const folder of folders) {
			if (!PRINT_SIZES.includes(folder as PrintSize)) {
				warn(`frames/${folder}: not a print size, skipping`)
			}
		}

		return PRINT_SIZES.filter((size) => folders.has(size)).flatMap((size) =>
			readdirSync(join(FRAMES_DIRECTORY, size))
				.filter((file) => /\.png$/i.test(file))
				.sort()
				.flatMap((file) => read(size, file, warn) ?? [])
		)
	}

	return {
		name: 'kapturae-frames',

		resolveId(id) {
			return id === ID ? RESOLVED : undefined
		},

		load(id) {
			if (id !== RESOLVED) {
				return
			}
			return `export default ${JSON.stringify(scan((message) => this.warn(message)))}`
		},

		configureServer(server) {
			server.watcher.add(FRAMES_DIRECTORY)

			function reload(path: string) {
				if (!path.startsWith(FRAMES_DIRECTORY)) {
					return
				}

				for (const environment of Object.values(server.environments)) {
					const module = environment.moduleGraph.getModuleById(RESOLVED)
					if (module) {
						environment.moduleGraph.invalidateModule(module)
					}
				}
				server.ws.send({ type: 'full-reload' })
			}

			server.watcher.on('add', reload).on('change', reload).on('unlink', reload)
		}
	}
}
