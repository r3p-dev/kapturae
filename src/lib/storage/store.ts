import { blobEntry, objectUrl } from '$lib/storage/blobs'
import { dropMissing, isBlankSession, packMedia, unpackMedia, type Media } from '$lib/storage/media'
import { shots, watchShots, type Shots } from '$lib/session/shots.svelte'

const STORAGE_KEY = 'kapturae:session'
const DATABASE_NAME = 'kapturae'
const STORE_NAME = 'media'
const LOCK_PREFIX = 'kapturae:session:'
const SAVE_DELAY = 250
const INLINE_LIMIT = 1024

type Saved = { id: string; state: unknown }

let sessionId = ''
let database: IDBDatabase | null = null
let stored = new Set<string>()
const dataIds = new Map<string, string>()
let pending: ReturnType<typeof setTimeout> | null = null
let queue = Promise.resolve()
let restoring: Promise<void> | null = null

function request<T>(operation: IDBRequest<T>) {
	return new Promise<T>((resolve, reject) => {
		operation.onsuccess = () => resolve(operation.result)
		operation.onerror = () => reject(operation.error)
	})
}

function openDatabase() {
	const opening = indexedDB.open(DATABASE_NAME, 1)
	opening.onupgradeneeded = () => opening.result.createObjectStore(STORE_NAME)
	return request(opening)
}

function sessionRange(id: string) {
	return IDBKeyRange.bound([id], [id, []])
}

function store(mode: IDBTransactionMode) {
	return database!.transaction(STORE_NAME, mode).objectStore(STORE_NAME)
}

async function readMedia(id: string) {
	const range = sessionRange(id)
	const keys = await request(store('readonly').getAllKeys(range))
	const values = await request(store('readonly').getAll(range))
	return new Map(keys.map((key, index) => [(key as [string, string])[1], values[index] as Media]))
}

function readSaved(): Saved | null {
	try {
		const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')
		return typeof saved?.id === 'string' ? saved : null
	} catch {
		return null
	}
}

function claim(id: string) {
	if (!navigator.locks) {
		return Promise.resolve(true)
	}

	return new Promise<boolean>((resolve) => {
		navigator.locks
			.request(LOCK_PREFIX + id, { ifAvailable: true }, (lock) => {
				resolve(Boolean(lock))
				return lock ? new Promise<void>(() => {}) : undefined
			})
			.catch(() => resolve(true))
	})
}

async function sweepAbandoned() {
	if (!database || !navigator.locks) {
		return
	}

	const { held = [] } = await navigator.locks.query()
	const live = new Set(held.map((lock) => lock.name))
	const kept = new Set([sessionId, readSaved()?.id])
	const keys = await request(store('readonly').getAllKeys())
	const abandoned = new Set(
		keys.map((key) => (key as [string, string])[0]).filter((id) => !kept.has(id) && !live.has(LOCK_PREFIX + id))
	)

	const writer = store('readwrite')
	for (const id of abandoned) {
		writer.delete(sessionRange(id))
	}
}

function lookup(text: string) {
	const entry = blobEntry(text)
	if (entry) {
		return { id: entry.id, media: entry.blob }
	}

	if (!text.startsWith('data:') || text.length <= INLINE_LIMIT) {
		return
	}

	let id = dataIds.get(text)
	if (!id) {
		id = crypto.randomUUID()
		dataIds.set(text, id)
	}
	return { id, media: text }
}

async function save(state: Shots) {
	const { packed, found } = packMedia(state, lookup)
	const isBlank = isBlankSession(state)

	if (database) {
		const writer = store('readwrite')

		for (const [id, media] of found) {
			if (!stored.has(id)) {
				writer.put(media, [sessionId, id])
			}
		}

		for (const id of stored) {
			if (!found.has(id)) {
				writer.delete([sessionId, id])
			}
		}

		await new Promise((resolve, reject) => {
			writer.transaction.oncomplete = resolve
			writer.transaction.onerror = () => reject(writer.transaction.error)
		})
		stored = new Set(found.keys())
	}

	for (const [text, id] of dataIds) {
		if (!found.has(id)) {
			dataIds.delete(text)
		}
	}

	try {
		if (isBlank) {
			sessionStorage.removeItem(STORAGE_KEY)
		} else {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id: sessionId, state: packed } satisfies Saved))
		}
	} catch {}
}

function schedule(state: Shots) {
	if (pending) {
		clearTimeout(pending)
	}

	pending = setTimeout(() => {
		pending = null
		queue = queue.then(() => save(state)).catch(() => {})
	}, SAVE_DELAY)
}

async function restore() {
	const saved = readSaved()

	try {
		database = await openDatabase()
	} catch {
		database = null
	}

	sessionId = saved?.id ?? crypto.randomUUID()
	const isOwner = await claim(sessionId)
	const media = saved && database ? await readMedia(sessionId).catch(() => new Map<string, Media>()) : new Map()

	if (isOwner) {
		stored = new Set(media.keys())
	} else {
		sessionId = crypto.randomUUID()
		await claim(sessionId)
	}

	if (saved) {
		const state = unpackMedia(saved.state, (id) => {
			const found = media.get(id)
			if (typeof found === 'string') {
				dataIds.set(found, id)
				return found
			}
			return found ? objectUrl(found, id) : undefined
		}) as Shots
		Object.assign(shots, dropMissing(state))
	}

	await sweepAbandoned().catch(() => {})

	watchShots(schedule)
}

export async function removeAbandonedSessions() {
	const existing = await indexedDB.databases?.().catch(() => [])
	if (!existing?.some((entry) => entry.name === DATABASE_NAME)) {
		return
	}

	database ??= await openDatabase().catch(() => null)
	await sweepAbandoned().catch(() => {})
}

export function restoreSession() {
	restoring ??= restore()
	return restoring
}
