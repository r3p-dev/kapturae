import { error, json } from '@sveltejs/kit'
import QRCode from 'qrcode'
import { FRAMES } from '$lib/frames'
import { baseLocale, isLocale, localizeHref } from '$lib/paraglide/runtime'
import {
	ASSET_MIME,
	MAX_ASSETS,
	MAX_FILE_BYTES,
	MAX_SHARE_BYTES,
	MAX_SLOTS,
	isShareAssetKind,
	isShareCategory,
	isValidAssetKey,
	saveShare,
	shareBaseUrl,
	startSweeper,
	type IncomingAsset,
	type ShareAsset
} from '$lib/server/share'
import type { RequestHandler } from './$types'

startSweeper()

function parseManifest(raw: FormDataEntryValue | null): ShareAsset[] {
	if (typeof raw !== 'string') {
		error(400, 'The manifest is missing.')
	}

	let parsed: unknown
	try {
		parsed = JSON.parse(raw)
	} catch {
		error(400, 'The manifest is not valid JSON.')
	}

	if (!Array.isArray(parsed) || !parsed.length) {
		error(400, 'The manifest is empty.')
	}
	if (parsed.length > MAX_ASSETS) {
		error(413, 'Too many files.')
	}

	const seen = new Set<string>()

	return parsed.map((entry: ShareAsset) => {
		const { key, kind, category, index } = entry

		if (typeof key !== 'string' || !isValidAssetKey(key)) {
			error(400, 'Invalid file name.')
		}
		if (!isShareAssetKind(kind)) {
			error(400, 'Invalid file type.')
		}
		if (!isShareCategory(category)) {
			error(400, 'Invalid category.')
		}
		if (index !== undefined && !(Number.isInteger(index) && index > 0 && index <= MAX_SLOTS)) {
			error(400, 'Invalid photo number.')
		}

		const name = `${key}.${kind}`
		if (seen.has(name)) {
			error(400, `Duplicate file ${name}.`)
		}
		seen.add(name)

		return { key, kind, category, index }
	})
}

async function collect(form: FormData, manifest: ShareAsset[]) {
	const incoming: IncomingAsset[] = []
	let bytes = 0

	for (const entry of manifest) {
		const name = `${entry.key}.${entry.kind}`
		const file = form.get(name)

		if (!(file instanceof File) || !file.size) {
			error(400, `File ${name} is missing.`)
		}
		if (file.size > MAX_FILE_BYTES) {
			error(413, `File ${name} is too large.`)
		}
		if (file.type !== ASSET_MIME[entry.kind]) {
			error(415, `File ${name} is the wrong format.`)
		}

		bytes += file.size
		if (bytes > MAX_SHARE_BYTES) {
			error(413, 'The whole upload is too large.')
		}

		incoming.push({ ...entry, data: await file.arrayBuffer() })
	}

	return incoming
}

async function qrDataUri(link: string) {
	const svg = await QRCode.toString(link, {
		type: 'svg',
		margin: 0,
		errorCorrectionLevel: 'M',
		color: { dark: '#0e0e0d', light: '#ffffff' }
	})

	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const POST: RequestHandler = async function ({ request, url }) {
	let form: FormData
	try {
		form = await request.formData()
	} catch {
		error(400, 'The request could not be read.')
	}

	const manifest = parseManifest(form.get('manifest'))
	const frame = FRAMES.find((candidate) => candidate.id === form.get('frame'))
	if (!frame) {
		error(400, 'Unknown frame.')
	}

	const slots = Number(form.get('slots'))
	if (slots !== frame.slots.length || slots > MAX_SLOTS) {
		error(400, 'Invalid slot count.')
	}

	const requested = form.get('locale')
	const locale = isLocale(requested) ? requested : baseLocale

	const assets = await collect(form, manifest)
	const share = await saveShare(frame.id, slots, assets)
	const link = shareBaseUrl(url.origin) + localizeHref(`/p/${share.id}`, { locale })

	return json({ id: share.id, url: link, expiresAt: share.expiresAt, qr: await qrDataUri(link) })
}
