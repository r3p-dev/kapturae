import { existsSync, statSync } from 'node:fs'
import { join, normalize } from 'node:path'

// Serves build/ the way deploy/Caddyfile does, so tests run against the same routing and headers as production.

const ROOT = join(import.meta.dirname, '..', 'build')

export const HEADERS = {
	'Content-Security-Policy': "frame-ancestors 'none'",
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()'
}

const TYPES: Record<string, string> = {
	'.webmanifest': 'application/manifest+json',
	'.xml': 'application/xml'
}

function isFile(path: string) {
	return existsSync(path) && statSync(path).isFile()
}

function resolveFile(pathname: string) {
	const base = join(ROOT, normalize(decodeURIComponent(pathname)))
	if (!base.startsWith(ROOT)) {
		return null
	}
	return [base, `${base}.html`, join(base, 'index.html')].find(isFile) ?? null
}

function respond(path: string, status: number, pathname: string) {
	const extension = path.slice(path.lastIndexOf('.'))
	const headers = new Headers(HEADERS)
	headers.set(
		'Cache-Control',
		pathname.startsWith('/_app/immutable/') ? 'public, max-age=31536000, immutable' : 'no-cache'
	)
	if (TYPES[extension]) {
		headers.set('Content-Type', TYPES[extension])
	}
	return new Response(Bun.file(path), { status, headers })
}

export function serveBuild(port: number) {
	return Bun.serve({
		port,
		hostname: '127.0.0.1',
		fetch(request) {
			const { pathname } = new URL(request.url)
			if (request.method !== 'GET' && request.method !== 'HEAD') {
				return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } })
			}
			const file = resolveFile(pathname)
			return file ? respond(file, 200, pathname) : respond(join(ROOT, '404.html'), 404, pathname)
		}
	})
}

if (import.meta.main) {
	const server = serveBuild(Number(process.env.PORT ?? 4173))
	console.log(`Serving build/ on ${server.url}`)
}
