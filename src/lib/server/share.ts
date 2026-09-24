import { randomBytes } from 'node:crypto'
import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const ASSET_MIME = {
	png: 'image/png',
	jpg: 'image/jpeg',
	gif: 'image/gif'
} as const

export type ShareAssetKind = keyof typeof ASSET_MIME

export const SHARE_CATEGORIES = ['plain', 'filtered', 'frame-filtered', 'frame'] as const

export type ShareCategory = (typeof SHARE_CATEGORIES)[number]

export type ShareAsset = {
	key: string
	kind: ShareAssetKind
	category: ShareCategory
	index?: number
}

export type ShareMetadata = {
	id: string
	createdAt: number
	expiresAt: number
	frame: string
	slots: number
	assets: ShareAsset[]
}

export type IncomingAsset = ShareAsset & { data: ArrayBuffer }

export const RETENTION_MS = 24 * 60 * 60 * 1000
export const MAX_FILE_BYTES = 25 * 1024 * 1024
export const MAX_SHARE_BYTES = 96 * 1024 * 1024
export const MAX_SLOTS = 12
export const MAX_ASSETS = (MAX_SLOTS * 2 + 3) * 2

const SWEEP_INTERVAL_MS = 15 * 60 * 1000
const ID_PATTERN = /^[0-9a-f]{16}$/
const KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/
const STORAGE_DIRECTORY = process.env.SHARE_STORAGE_DIR || '.uploads'

let sweeper: ReturnType<typeof setInterval> | null = null

function metadataPath(id: string) {
	return join(STORAGE_DIRECTORY, `${id}.json`)
}
function assetPath(id: string, key: string, kind: ShareAssetKind) {
	return join(STORAGE_DIRECTORY, `${id}--${key}.${kind}`)
}

export function isShareAssetKind(kind: unknown): kind is ShareAssetKind {
	return typeof kind === 'string' && Object.hasOwn(ASSET_MIME, kind)
}

export function isShareCategory(category: unknown): category is ShareCategory {
	return SHARE_CATEGORIES.includes(category as ShareCategory)
}

export function isValidShareId(id: string) {
	return ID_PATTERN.test(id)
}

export function isValidAssetKey(key: string) {
	return KEY_PATTERN.test(key)
}

export function parseAssetName(name: string) {
	const dot = name.lastIndexOf('.')
	const key = name.slice(0, dot)
	const kind = name.slice(dot + 1)

	return dot > 0 && isValidAssetKey(key) && isShareAssetKind(kind) ? { key, kind } : null
}

async function readMetadata(id: string): Promise<ShareMetadata | null> {
	try {
		return JSON.parse(await readFile(metadataPath(id), 'utf8'))
	} catch {
		return null
	}
}

async function removeShare(id: string) {
	const metadata = await readMetadata(id)
	const files = [metadataPath(id), ...(metadata?.assets ?? []).map((asset) => assetPath(id, asset.key, asset.kind))]

	await Promise.all(files.map((file) => unlink(file).catch(() => {})))
}

export async function sweepExpired() {
	let entries: string[]
	try {
		entries = await readdir(STORAGE_DIRECTORY)
	} catch {
		return
	}

	const now = Date.now()
	const live = new Set<string>()

	for (const entry of entries) {
		const id = entry.slice(0, -'.json'.length)
		if (!entry.endsWith('.json') || !isValidShareId(id)) {
			continue
		}

		const metadata = await readMetadata(id)
		if (!metadata || metadata.expiresAt <= now) {
			await removeShare(id)
		} else {
			live.add(id)
		}
	}

	for (const entry of entries) {
		if (entry.endsWith('.json') || live.has(entry.split('--')[0])) {
			continue
		}

		const file = join(STORAGE_DIRECTORY, entry)
		const info = await stat(file).catch(() => null)
		if (info && now - info.mtimeMs > RETENTION_MS) {
			await unlink(file).catch(() => {})
		}
	}
}

export function startSweeper() {
	if (sweeper) {
		return
	}

	sweeper = setInterval(() => void sweepExpired(), SWEEP_INTERVAL_MS)
	sweeper.unref?.()
	void sweepExpired()
}

export async function saveShare(frame: string, slots: number, incoming: IncomingAsset[]): Promise<ShareMetadata> {
	await mkdir(STORAGE_DIRECTORY, { recursive: true })

	const id = randomBytes(8).toString('hex')
	const createdAt = Date.now()
	const metadata: ShareMetadata = {
		id,
		createdAt,
		expiresAt: createdAt + RETENTION_MS,
		frame,
		slots,
		assets: incoming.map(({ key, kind, category, index }) => ({ key, kind, category, index }))
	}

	await Promise.all(incoming.map((asset) => writeFile(assetPath(id, asset.key, asset.kind), Buffer.from(asset.data))))
	await writeFile(metadataPath(id), JSON.stringify(metadata))

	return metadata
}

export async function readShare(id: string) {
	if (!isValidShareId(id)) {
		return null
	}

	const metadata = await readMetadata(id)
	if (!metadata) {
		return null
	}

	if (metadata.expiresAt <= Date.now()) {
		await removeShare(id)
		return null
	}

	return metadata
}

export async function deleteShare(id: string) {
	if (isValidShareId(id)) {
		await removeShare(id)
	}
}

export async function readShareAsset(id: string, key: string, kind: ShareAssetKind) {
	const metadata = await readShare(id)
	if (!metadata?.assets.some((asset) => asset.key === key && asset.kind === kind)) {
		return null
	}

	return readFile(assetPath(id, key, kind)).catch(() => null)
}

export async function readAllShareAssets(id: string) {
	const metadata = await readShare(id)
	if (!metadata) {
		return null
	}

	const files: { asset: ShareAsset; data: Buffer }[] = []
	for (const asset of metadata.assets) {
		const data = await readFile(assetPath(id, asset.key, asset.kind)).catch(() => null)
		if (data) {
			files.push({ asset, data })
		}
	}

	return { metadata, files }
}

export function shareBaseUrl(origin: string) {
	return (process.env.SHARE_BASE_URL || origin).replace(/\/+$/, '')
}
