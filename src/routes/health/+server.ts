import type { RequestHandler } from './$types'

export const GET: RequestHandler = function () {
	return new Response('ok', { headers: { 'cache-control': 'no-store' } })
}
