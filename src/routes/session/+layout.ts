import { browser } from '$app/environment'
import { restoreSession } from '$lib/session-store'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async function () {
	if (browser) {
		await restoreSession()
	}
}
