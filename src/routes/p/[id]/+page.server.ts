import { error, redirect } from '@sveltejs/kit'
import { FRAMES } from '$lib/frames'
import { SIZES } from '$lib/session'
import { deleteShare, readShare } from '$lib/server/share'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
	setHeaders({ 'x-robots-tag': 'noindex', 'cache-control': 'private, no-store' })

	if (url.searchParams.has('deleted')) return { deleted: true as const }

	const meta = await readShare(params.id)
	if (!meta) error(410, 'Gone')

	const frame = FRAMES.find((f) => f.id === meta.frame)
	const size = frame && SIZES[frame.size]

	return {
		deleted: false as const,
		id: meta.id,
		createdAt: meta.createdAt,
		expiresAt: meta.expiresAt,
		slots: meta.slots,
		frame: frame && size ? { name: frame.name, size: size.label, cm: size.cm, ratio: size.ratio } : null,
		assets: meta.assets
	}
}

export const actions: Actions = {
	delete: async ({ params, url }) => {
		await deleteShare(params.id)
		redirect(303, `${url.pathname}?deleted`)
	}
}
