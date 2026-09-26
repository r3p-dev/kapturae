import { browser } from '$app/environment'
import { restoreSession } from '$lib/storage/store'
import type { LayoutLoad } from './$types'

export const ssr = false

export const load: LayoutLoad = async function () {
	if (browser) {
		await restoreSession()
	}
}
