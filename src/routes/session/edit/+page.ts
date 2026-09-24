import { redirect } from '@sveltejs/kit'
import { browser } from '$app/environment'
import { FRAMES } from '$lib/frames'
import { localizeHref } from '$lib/paraglide/runtime'
import { PRINT_SIZES, pick } from '$lib/session'
import { shots } from '$lib/shots.svelte'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ url }) => {
	if (!browser) return

	const size = pick(PRINT_SIZES, url.searchParams.get('size')) ?? '2x6'
	const frame = FRAMES.find((f) => f.id === url.searchParams.get('frame')) ?? FRAMES.find((f) => f.size === size)
	const query = new URLSearchParams(frame ? { size: frame.size, frame: frame.id } : { size })

	if (shots.frame !== frame?.id || !shots.photos.some(Boolean)) {
		redirect(307, localizeHref(`/session/frame?${query}`))
	}
}
