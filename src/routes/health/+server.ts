import type { RequestHandler } from './$types'

/** Liveness probe for the Docker HEALTHCHECK (scripts/healthcheck.ts). */
export const GET: RequestHandler = () => new Response('ok', { headers: { 'cache-control': 'no-store' } })
