import { describe, expect, test } from 'bun:test'
import { Glob } from 'bun'
import { readFileSync } from 'node:fs'

const SOURCES = [...new Glob('src/**/*.{ts,svelte}').scanSync()].filter(
	(file) => !file.startsWith('src/lib/paraglide/')
)

function matching(pattern: RegExp) {
	return SOURCES.filter((file) => pattern.test(readFileSync(file, 'utf8')))
}

describe('network surface', () => {
	test('no client code sends requests', () => {
		expect(matching(/\bfetch\(|XMLHttpRequest|sendBeacon|new WebSocket|new EventSource/)).toEqual([
			'src/service-worker.ts'
		])
	})

	test('the service worker only fetches same-origin GET requests', () => {
		const worker = readFileSync('src/service-worker.ts', 'utf8')

		expect(worker).toContain("request.method !== 'GET' || url.origin !== worker.location.origin")
		expect(worker).not.toMatch(/indexedDB|blob:|postMessage/)
	})

	test('no absolute urls outside links to the author', () => {
		const urls = SOURCES.flatMap((file) => readFileSync(file, 'utf8').match(/https?:\/\/[^\s"'`)<>]+/g) ?? [])
		const external = urls.filter(
			(url) =>
				!/^https:\/\/(kapturae\.r3p\.dev|r3p\.dev|github\.com\/r3p-dev|schema\.org)|^http:\/\/www\.(w3|sitemaps)\.org/.test(
					url
				)
		)

		expect(external).toEqual([])
	})

	test('the only endpoint is the sitemap, rendered at build time', () => {
		const endpoints = [...new Glob('src/routes/**/+{server,page.server,layout.server}.ts').scanSync()]

		expect(endpoints).toEqual(['src/routes/sitemap.xml/+server.ts'])
		expect(readFileSync(endpoints[0], 'utf8')).toContain('export const prerender = true')
	})

	test('no endpoint accepts uploads', () => {
		expect(matching(/export const (POST|PUT|PATCH|DELETE)\b|export const actions\b/)).toEqual([])
	})
})
