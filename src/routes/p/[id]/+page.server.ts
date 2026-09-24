import { error, redirect } from '@sveltejs/kit'
import { FRAMES } from '$lib/frames'
import { SIZES } from '$lib/session'
import { deleteShare, readShare } from '$lib/server/share'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async function ({ params, url, setHeaders }) {
	setHeaders({ 'x-robots-tag': 'noindex', 'cache-control': 'private, no-store' })

	if (url.searchParams.has('deleted')) {
		return { deleted: true as const }
	}

	const share = await readShare(params.id)
	if (!share) {
		error(410, 'Gone')
	}

	const frame = FRAMES.find((candidate) => candidate.id === share.frame)
	const size = frame && SIZES[frame.size]

	return {
		deleted: false as const,
		id: share.id,
		createdAt: share.createdAt,
		expiresAt: share.expiresAt,
		slots: share.slots,
		frame: frame && size ? { name: frame.name, size: size.label, cm: size.cm, ratio: size.ratio } : null,
		assets: share.assets
	}
}

export const actions: Actions = {
	async delete({ params, url }) {
		await deleteShare(params.id)
		redirect(303, `${url.pathname}?deleted`)
	}
}
