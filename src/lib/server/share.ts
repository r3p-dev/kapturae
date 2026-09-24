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

export type ShareMeta = {
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
const STORAGE_DIR = process.env.SHARE_STORAGE_DIR || '.uploads'

let sweeper: ReturnType<typeof setInterval> | null = null

const metaPath = (id: string) => join(STORAGE_DIR, `${id}.json`)
const assetPath = (id: string, key: string, kind: ShareAssetKind) => join(STORAGE_DIR, `${id}--${key}.${kind}`)

export const isShareAssetKind = (kind: unknown): kind is ShareAssetKind =>
	typeof kind === 'string' && Object.hasOwn(ASSET_MIME, kind)

export const isShareCategory = (category: unknown): category is ShareCategory =>
	SHARE_CATEGORIES.includes(category as ShareCategory)

export const isValidShareId = (id: string) => ID_PATTERN.test(id)

export const isValidAssetKey = (key: string) => KEY_PATTERN.test(key)

export function parseAssetName(name: string) {
	const dot = name.lastIndexOf('.')
	const key = name.slice(0, dot)
	const kind = name.slice(dot + 1)

	return dot > 0 && isValidAssetKey(key) && isShareAssetKind(kind) ? { key, kind } : null
}

async function readMeta(id: string): Promise<ShareMeta | null> {
	try {
		return JSON.parse(await readFile(metaPath(id), 'utf8'))
	} catch {
		return null
	}
}

async function removeShare(id: string) {
	const meta = await readMeta(id)
	const files = [metaPath(id), ...(meta?.assets ?? []).map((a) => assetPath(id, a.key, a.kind))]

	await Promise.all(files.map((file) => unlink(file).catch(() => {})))
}

export async function sweepExpired() {
	let entries: string[]
	try {
		entries = await readdir(STORAGE_DIR)
	} catch {
		return
	}

	const now = Date.now()
	const live = new Set<string>()

	for (const entry of entries) {
		const id = entry.slice(0, -'.json'.length)
		if (!entry.endsWith('.json') || !isValidShareId(id)) continue

		const meta = await readMeta(id)
		if (!meta || meta.expiresAt <= now) await removeShare(id)
		else live.add(id)
	}

	for (const entry of entries) {
		if (entry.endsWith('.json') || live.has(entry.split('--')[0])) continue

		const file = join(STORAGE_DIR, entry)
		const info = await stat(file).catch(() => null)
		if (info && now - info.mtimeMs > RETENTION_MS) await unlink(file).catch(() => {})
	}
}

export function startSweeper() {
	if (sweeper) return
	sweeper = setInterval(() => void sweepExpired(), SWEEP_INTERVAL_MS)
	sweeper.unref?.()
	void sweepExpired()
}

export async function saveShare(frame: string, slots: number, incoming: IncomingAsset[]): Promise<ShareMeta> {
	await mkdir(STORAGE_DIR, { recursive: true })

	const id = randomBytes(8).toString('hex')
	const createdAt = Date.now()
	const meta: ShareMeta = {
		id,
		createdAt,
		expiresAt: createdAt + RETENTION_MS,
		frame,
		slots,
		assets: incoming.map(({ key, kind, category, index }) => ({ key, kind, category, index }))
	}

	await Promise.all(incoming.map((asset) => writeFile(assetPath(id, asset.key, asset.kind), Buffer.from(asset.data))))
	await writeFile(metaPath(id), JSON.stringify(meta))

	return meta
}

export async function readShare(id: string) {
	if (!isValidShareId(id)) return null

	const meta = await readMeta(id)
	if (!meta) return null

	if (meta.expiresAt <= Date.now()) {
		await removeShare(id)
		return null
	}

	return meta
}

export async function deleteShare(id: string) {
	if (isValidShareId(id)) await removeShare(id)
}

export async function readShareAsset(id: string, key: string, kind: ShareAssetKind) {
	const meta = await readShare(id)
	if (!meta?.assets.some((asset) => asset.key === key && asset.kind === kind)) return null

	return readFile(assetPath(id, key, kind)).catch(() => null)
}

export async function readAllShareAssets(id: string) {
	const meta = await readShare(id)
	if (!meta) return null

	const files: { asset: ShareAsset; data: Buffer }[] = []
	for (const asset of meta.assets) {
		const data = await readFile(assetPath(id, asset.key, asset.kind)).catch(() => null)
		if (data) files.push({ asset, data })
	}

	return { meta, files }
}

export const shareBaseUrl = (origin: string) => (process.env.SHARE_BASE_URL || origin).replace(/\/+$/, '')
