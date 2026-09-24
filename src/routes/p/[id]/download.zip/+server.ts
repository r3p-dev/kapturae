import { error } from '@sveltejs/kit'
import { zipSync } from 'fflate'
import { readAllShareAssets, type ShareAsset } from '$lib/server/share'
import type { RequestHandler } from './$types'

function pathFor({ category, kind, index }: ShareAsset) {
	const name = kind === 'gif' ? 'gif' : 'photo'
	if (index) {
		return `${category}/${name}-${index}.${kind}`
	}
	return `${category}/${category.startsWith('frame') ? `sheet-${name}` : 'slideshow'}.${kind}`
}

export const GET: RequestHandler = async function ({ params }) {
	const share = await readAllShareAssets(params.id)
	if (!share?.files.length) {
		error(410, 'Gone')
	}

	const entries = Object.fromEntries(share.files.map(({ asset, data }) => [pathFor(asset), new Uint8Array(data)]))
	const zip = zipSync(entries, { level: 0 })

	return new Response(new Uint8Array(zip), {
		headers: {
			'content-type': 'application/zip',
			'content-length': String(zip.byteLength),
			'content-disposition': `attachment; filename="kapturae-${params.id}.zip"`,
			'cache-control': 'private, max-age=600',
			'x-robots-tag': 'noindex'
		}
	})
}
