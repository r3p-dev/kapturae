import { error } from '@sveltejs/kit'
import { ASSET_MIME, parseAssetName, readShareAsset } from '$lib/server/share'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
	const name = parseAssetName(params.asset)
	const file = name && (await readShareAsset(params.id, name.key, name.kind))
	if (!name || !file) error(404, 'Not found')

	return new Response(new Uint8Array(file), {
		headers: {
			'content-type': ASSET_MIME[name.kind],
			'cache-control': 'private, max-age=600',
			'content-disposition': `inline; filename="kapturae-${params.id}-${params.asset}"`,
			'x-robots-tag': 'noindex'
		}
	})
}
