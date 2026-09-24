import type { Reroute } from '@sveltejs/kit'
import { deLocalizeUrl } from '$lib/paraglide/runtime'

export const reroute: Reroute = function (request) {
	return deLocalizeUrl(request.url).pathname
}
