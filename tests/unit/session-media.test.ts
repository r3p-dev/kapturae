import { describe, expect, test } from 'bun:test'
import { REFERENCE, dropMissing, isBlankSession, packMedia, unpackMedia } from '$lib/session-media'
import type { Shots } from '$lib/shots.svelte'

const BURST_FRAME = `data:image/jpeg;base64,${'A'.repeat(2000)}`

function session(): Shots {
	return {
		size: '2x6',
		frame: '2x6-classic-strip',
		photos: ['blob:photo-1', ''],
		library: [{ url: 'blob:photo-1', source: 'camera', burst: [BURST_FRAME] }],
		uploads: ['blob:sticker-1'],
		edit: {
			color: null,
			order: [0, 1],
			slots: [],
			strokes: [],
			items: [
				{ id: 1, kind: 'sticker', sticker: 'blob:sticker-1', x: 50, y: 50, size: 20 },
				{ id: 2, kind: 'sticker', sticker: 'star', x: 10, y: 10, size: 20 },
				{ id: 3, kind: 'text', text: 'hi', font: 'bold', color: '#fff', x: 1, y: 1, size: 9 }
			]
		}
	}
}

const MEDIA: Record<string, string> = { 'blob:photo-1': 'photo', 'blob:sticker-1': 'sticker', [BURST_FRAME]: 'burst' }

function lookup(text: string) {
	return text in MEDIA ? { id: MEDIA[text], media: text } : undefined
}

describe('packMedia', () => {
	test('replaces media with references and collects each once', () => {
		const { packed, found } = packMedia(session(), lookup)
		const state = packed as Shots

		expect(state.photos).toEqual([`${REFERENCE}photo`, ''])
		expect(state.library[0].burst).toEqual([`${REFERENCE}burst`])
		expect([...found.keys()].sort()).toEqual(['burst', 'photo', 'sticker'])
		expect(JSON.stringify(packed)).not.toContain('base64')
	})
})

describe('unpackMedia', () => {
	test('round trips to new urls', () => {
		const { packed } = packMedia(session(), lookup)
		const state = unpackMedia(packed, (id) => `blob:new-${id}`) as Shots

		expect(state.photos).toEqual(['blob:new-photo', ''])
		expect(state.uploads).toEqual(['blob:new-sticker'])
		expect(state.edit?.items[1]).toMatchObject({ sticker: 'star' })
	})

	test('drops media that did not survive', () => {
		const { packed } = packMedia(session(), lookup)
		const state = dropMissing(unpackMedia(packed, (id) => (id === 'photo' ? 'blob:new-photo' : undefined)) as Shots)

		expect(state.library).toEqual([{ url: 'blob:new-photo', source: 'camera', burst: [] }])
		expect(state.uploads).toEqual([])
		expect(state.edit?.items.map((item) => item.id)).toEqual([2, 3])
	})

	test('never revives a stale blob url', () => {
		expect(unpackMedia({ photos: ['blob:stale'] }, () => undefined)).toEqual({ photos: [''] })
	})
})

describe('isBlankSession', () => {
	test('is true only once everything is cleared', () => {
		expect(isBlankSession(session())).toBe(false)
		expect(isBlankSession({ size: null, frame: null, photos: [], library: [], uploads: [], edit: null })).toBe(true)
	})
})
