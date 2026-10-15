import { existsSync, statSync } from 'node:fs'
import { join, normalize } from 'node:path'
import { CONTENT_TYPES, HEADERS, METHODS, NOT_FOUND, cacheControl, candidates } from './hosting.ts'

const ROOT = join(import.meta.dirname, '..', 'build')

function isFile(path: string) {
	return existsSync(path) && statSync(path).isFile()
}

function resolveFile(pathname: string) {
	const decoded = decodeURIComponent(pathname)
	const paths = candidates(decoded).map((candidate) => join(ROOT, normalize(candidate)))
	if (!paths.every((path) => path.startsWith(ROOT))) {
		return null
	}

	return paths.find(isFile) ?? null
}

function respond(path: string, status: number, pathname: string) {
	const extension = path.slice(path.lastIndexOf('.'))
	const headers = new Headers(HEADERS)

	headers.set('Cache-Control', cacheControl(pathname))

	if (CONTENT_TYPES[extension]) {
		headers.set('Content-Type', CONTENT_TYPES[extension])
	}

	return new Response(Bun.file(path), { status, headers })
}

export function serveBuild(port: number, hostname = '127.0.0.1') {
	return Bun.serve({
		port,
		hostname,
		fetch(request) {
			const { pathname } = new URL(request.url)

			if (!(METHODS as readonly string[]).includes(request.method)) {
				return new Response(null, { status: 405, headers: { Allow: METHODS.join(', ') } })
			}

			const file = resolveFile(pathname)
			return file ? respond(file, 200, pathname) : respond(join(ROOT, NOT_FOUND), 404, pathname)
		}
	})
}

if (import.meta.main) {
	const server = serveBuild(Number(process.env.PORT ?? 4173))
	console.log(`Serving build/ on ${server.url}`)
}
