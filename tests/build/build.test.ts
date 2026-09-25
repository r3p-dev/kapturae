import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { Glob } from 'bun'
import { INDEXED_PATHS, localizedUrl } from '$lib/seo'
import { HEADERS, serveBuild } from '../../scripts/serve_build.ts'

const CLIENT = '.svelte-kit/output/client'
const BUDGET_KB = 96
const CEILINGS_KB: Record<string, number> = {
	'/session/shoot': 115,
	'/session/edit': 125
}

let server: ReturnType<typeof serveBuild>

function url(path: string) {
	return new URL(path, server.url).href
}

async function html(path: string) {
	const response = await fetch(url(path))
	expect(response.status).toBe(200)
	return response.text()
}

function head(markup: string) {
	return markup.slice(0, markup.indexOf('</head>'))
}

function metaPolicy(markup: string) {
	return markup.match(/<meta http-equiv="content-security-policy" content="([^"]+)"/)?.[1] ?? ''
}

type Manifest = Record<string, { file: string; name?: string; imports?: string[] }>

function javascriptKilobytes(route: string) {
	const manifest: Manifest = JSON.parse(readFileSync(`${CLIENT}/.vite/manifest.json`, 'utf8'))
	const app = readFileSync('.svelte-kit/generated/client-optimized/app.js', 'utf8')
	const pattern = new RegExp(`"${route.replace(/[[\]]/g, '\\$&')}": \\[~?(\\d+)(?:,\\[([\\d,]*)\\])?`)
	const [, leaf, layouts] = app.match(pattern) ?? []
	expect(leaf).toBeDefined()

	const nodes = [0, Number(leaf), ...(layouts ? layouts.split(',').map(Number) : [])]
	const keys = new Set<string>()

	function collect(key: string) {
		if (keys.has(key) || !manifest[key]) {
			return
		}
		keys.add(key)
		for (const imported of manifest[key].imports ?? []) {
			collect(imported)
		}
	}

	for (const [key, chunk] of Object.entries(manifest)) {
		if (chunk.name === 'entry/start' || chunk.name === 'entry/app') {
			collect(key)
		}
	}
	for (const node of nodes) {
		collect(`.svelte-kit/generated/client-optimized/nodes/${node}.js`)
	}

	let bytes = 0
	for (const key of keys) {
		bytes += gzipSync(readFileSync(`${CLIENT}/${manifest[key].file}`), { level: 9 }).length
	}
	return bytes / 1024
}

beforeAll(() => {
	if (!existsSync('build/index.html')) {
		throw new Error('Run `bun run build` first.')
	}
	server = serveBuild(0)
})

afterAll(() => {
	server?.stop(true)
})

describe('static output', () => {
	test('contains no server', () => {
		const scripts = [...new Glob('**/*.{js,mjs}').scanSync('build')]

		expect(scripts.filter((file) => !file.startsWith('_app/') && file !== 'service-worker.js')).toEqual([])
	})

	test.each([
		'index.html',
		'id.html',
		'legal/privacy.html',
		'id/legal/terms.html',
		'session/frame.html',
		'id/session/edit.html',
		'404.html',
		'sitemap.xml'
	])('prerenders %s', (file) => {
		expect(existsSync(`build/${file}`)).toBe(true)
	})
})

describe('content security policy', () => {
	test.each(['/', '/id', '/legal/privacy', '/session/frame', '/session/edit', '/nope'])(
		'%s carries a strict policy in <meta>',
		async (path) => {
			const response = await fetch(url(path))
			const policy = metaPolicy(await response.text())

			expect(policy).toContain("default-src 'self'")
			expect(policy).toContain("connect-src 'self'")
			expect(policy).toMatch(/script-src 'self' 'sha256-[^']+'/)
			expect(policy).not.toContain('unsafe-eval')
			expect(policy).not.toMatch(/script-src[^;]*unsafe-inline/)
		}
	)

	test('the server header only adds what <meta> cannot carry', async () => {
		const response = await fetch(url('/'))

		expect(response.headers.get('content-security-policy')).toBe("frame-ancestors 'none'")
	})

	test('deploy/Caddyfile sends the same headers as the test server and keeps no log', () => {
		const caddyfile = readFileSync('deploy/Caddyfile', 'utf8')
		const directives = caddyfile.replace(/#.*$/gm, '')

		for (const [name, value] of Object.entries(HEADERS)) {
			expect(directives).toContain(`${name} "${value}"`)
		}
		expect(directives).not.toMatch(/^\s*log\b/m)
		expect(directives).not.toMatch(/script-src|default-src/)
	})
})

describe('share feature is gone', () => {
	test.each(['/p/0123456789abcdef', '/p/0123456789abcdef/download.zip', '/api/share'])(
		'GET %s is not found',
		async (path) => {
			const response = await fetch(url(path))
			expect(response.status).toBe(404)
		}
	)

	test('nothing accepts a POST', async () => {
		const response = await fetch(url('/api/share'), { method: 'POST', body: 'x' })
		expect(response.ok).toBe(false)
	})
})

describe('search', () => {
	test('home page carries the brand, canonical, languages and structured data', async () => {
		const markup = head(await html('/'))

		expect(markup).toContain('<title>Kapturae')
		expect(markup).toContain('<link rel="canonical" href="https://kapturae.r3p.dev/"')
		expect(markup).toContain('hreflang="id" href="https://kapturae.r3p.dev/id"')
		expect(markup).toContain('hreflang="x-default" href="https://kapturae.r3p.dev/"')
		expect(markup).toContain('<meta property="og:site_name" content="Kapturae"')
		expect(markup).not.toContain('noindex')

		const json = markup.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1]
		const data = JSON.parse(json ?? 'null')
		expect(data['@graph'][0]).toMatchObject({ '@type': 'WebSite', name: 'Kapturae' })
	})

	test('indonesian pages are in Indonesian and point at themselves', async () => {
		const markup = head(await html('/id'))

		expect(markup).toContain('<html lang="id"')
		expect(markup).toContain('<link rel="canonical" href="https://kapturae.r3p.dev/id"')
	})

	test('/legal is canonicalised to the privacy policy', async () => {
		expect(head(await html('/legal'))).toContain('<link rel="canonical" href="https://kapturae.r3p.dev/legal/privacy"')
	})

	test.each(['/session/frame', '/session/shoot', '/session/edit', '/session/done', '/id/session/frame'])(
		'%s is kept out of the index',
		async (path) => {
			expect(head(await html(path))).toContain('<meta name="robots" content="noindex"')
		}
	)

	test('unknown pages are a 404 that is not indexed', async () => {
		const response = await fetch(url('/nope'))
		const markup = await response.text()

		expect(response.status).toBe(404)
		expect(head(markup)).toContain('<meta name="robots" content="noindex"')
	})

	test('no page has breadcrumbs', async () => {
		for (const path of ['/', '/id', '/legal/privacy', '/id/legal/terms']) {
			expect(await html(path)).not.toMatch(/breadcrumb/i)
		}
	})

	test('sitemap lists every indexed page in both languages', async () => {
		const response = await fetch(url('/sitemap.xml'))
		const xml = await response.text()

		expect(response.headers.get('content-type')).toContain('xml')
		for (const path of INDEXED_PATHS) {
			expect(xml).toContain(`<loc>${localizedUrl(path, 'en')}</loc>`)
			expect(xml).toContain(`<loc>${localizedUrl(path, 'id')}</loc>`)
		}
		expect(xml).not.toContain('/session')
	})

	test('robots.txt allows crawling and points at the sitemap', async () => {
		const response = await fetch(url('/robots.txt'))
		const text = await response.text()

		expect(text).toContain('Allow: /')
		expect(text).toContain('Sitemap: https://kapturae.r3p.dev/sitemap.xml')
	})
})

describe('caching', () => {
	test('hashed assets are cached forever, everything else is revalidated', async () => {
		const markup = await html('/')
		const asset = markup.match(/\/_app\/immutable\/[^"]+\.js/)?.[0] ?? ''
		const page = await fetch(url('/'))
		const worker = await fetch(url('/service-worker.js'))
		const immutable = await fetch(url(asset))

		expect(page.headers.get('cache-control')).toBe('no-cache')
		expect(worker.headers.get('cache-control')).toBe('no-cache')
		expect(immutable.status).toBe(200)
		expect(immutable.headers.get('cache-control')).toContain('immutable')
	})
})

describe('javascript budget', () => {
	test(`home page loads at most ${BUDGET_KB} KB of gzipped JavaScript`, () => {
		expect(javascriptKilobytes('/')).toBeLessThanOrEqual(BUDGET_KB)
	})

	test.each(['/legal/[[doc=legal]]', '/session/frame', '/session/done', '/session/shoot', '/session/edit'])(
		'%s stays under its ceiling',
		(route) => {
			expect(javascriptKilobytes(route)).toBeLessThanOrEqual(CEILINGS_KB[route] ?? BUDGET_KB)
		}
	)
})
