import type { Shots } from '$lib/shots.svelte'

export type Media = Blob | string

export const REFERENCE = 'kapturae-media:'

export function packMedia(value: unknown, lookup: (text: string) => { id: string; media: Media } | undefined) {
	const found = new Map<string, Media>()

	function walk(node: unknown): unknown {
		if (typeof node === 'string') {
			const match = lookup(node)
			if (!match) {
				return node
			}
			found.set(match.id, match.media)
			return REFERENCE + match.id
		}

		if (Array.isArray(node)) {
			return node.map(walk)
		}

		if (node && typeof node === 'object') {
			return Object.fromEntries(Object.entries(node).map(([key, child]) => [key, walk(child)]))
		}

		return node
	}

	return { packed: walk(value), found }
}

export function unpackMedia(value: unknown, revive: (id: string) => string | undefined): unknown {
	if (typeof value === 'string') {
		if (value.startsWith(REFERENCE)) {
			return revive(value.slice(REFERENCE.length)) ?? ''
		}
		return value.startsWith('blob:') ? '' : value
	}

	if (Array.isArray(value)) {
		return value.map((child) => unpackMedia(child, revive))
	}

	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, unpackMedia(child, revive)]))
	}

	return value
}

export function dropMissing(state: Shots): Shots {
	const edit = state.edit && {
		...state.edit,
		items: state.edit.items.filter((item) => item.kind !== 'sticker' || item.sticker)
	}

	return {
		...state,
		library: state.library
			.filter((photo) => photo.url)
			.map((photo) => ({ ...photo, burst: photo.burst.filter(Boolean) })),
		uploads: state.uploads.filter(Boolean),
		edit
	}
}

export function isBlankSession(state: Shots) {
	return !state.size && !state.frame && !state.library.length && !state.uploads.length
}
