import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { INDEXED_PATHS, localizedUrl } from '$lib/seo'

const PORT = 4400 + Math.floor(Math.random() * 500)
const ORIGIN = `http://127.0.0.1:${PORT}`

const BUDGET_KB = 96
const CEILINGS_KB: Record<string, number> = {
	'/session/shoot': 115,
	'/session/edit': 125
}

let server: ReturnType<typeof Bun.spawn>

async function waitForServer() {
	for (const attempt of Array.from({ length: 50 }).keys()) {
		try {
			const response = await fetch(`${ORIGIN}/health`)
			if (response.ok) {
				return
			}
		} catch {}
		await Bun.sleep(100 + attempt * 10)
	}
	throw new Error('server did not start')
}

async function html(path: string) {
	const response = await fetch(ORIGIN + path)
	expect(response.status).toBe(200)
	return response.text()
}

function head(markup: string) {
	return markup.slice(0, markup.indexOf('</head>'))
}

async function javascriptKilobytes(path: string) {
	const response = await fetch(ORIGIN + path)
	const links = response.headers.get('link') ?? ''
	const files = new Set([...links.matchAll(/<\.?\/?([^>]+\.js)>; rel="modulepreload"/g)].map(([, file]) => file))

	expect(files.size).toBeGreaterThan(5)
	let bytes = 0
	for (const file of files) {
		bytes += gzipSync(readFileSync(`build/client/${file}`), { level: 9 }).length
	}
	return bytes / 1024
}

beforeAll(async () => {
	if (!existsSync('build/index.js')) {
		throw new Error('Run `bun run build` first.')
	}
	server = Bun.spawn(['bun', 'build/index.js'], {
		env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1' },
		stdout: 'ignore',
		stderr: 'inherit'
	})
	await waitForServer()
})

afterAll(() => {
	server?.kill()
})

describe('content security policy', () => {
	test.each(['/', '/id', '/legal/privacy', '/session/frame'])('%s sends a strict policy', async (path) => {
		const response = await fetch(ORIGIN + path)
		const policy = response.headers.get('content-security-policy') ?? ''

		expect(policy).toContain("connect-src 'self'")
		expect(policy).toContain("default-src 'self'")
		expect(policy).toContain("frame-ancestors 'none'")
		expect(policy).toMatch(/script-src 'self' 'nonce-/)
		expect(policy).not.toContain('unsafe-eval')
	})
})

describe('share feature is gone', () => {
	test.each([
		['GET', '/p/0123456789abcdef'],
		['GET', '/p/0123456789abcdef/download.zip'],
		['POST', '/api/share']
	])('%s %s is not found', async (method, path) => {
		const response = await fetch(ORIGIN + path, { method })
		expect(response.status).toBe(404)
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

	test('indonesian home points at itself', async () => {
		const markup = head(await html('/id'))

		expect(markup).toContain('<link rel="canonical" href="https://kapturae.r3p.dev/id"')
	})

	test('/legal is canonicalised to the privacy policy', async () => {
		expect(head(await html('/legal'))).toContain('<link rel="canonical" href="https://kapturae.r3p.dev/legal/privacy"')
	})

	test.each(['/session/frame', '/session/shoot', '/session/edit', '/session/done'])(
		'%s is kept out of the index',
		async (path) => {
			expect(head(await html(path))).toContain('<meta name="robots" content="noindex"')
		}
	)

	test('no page has breadcrumbs', async () => {
		for (const path of ['/', '/id', '/legal/privacy', '/id/legal/terms']) {
			expect(await html(path)).not.toMatch(/breadcrumb/i)
		}
	})

	test('sitemap lists every indexed page in both languages', async () => {
		const response = await fetch(`${ORIGIN}/sitemap.xml`)
		const xml = await response.text()

		expect(response.headers.get('content-type')).toContain('xml')
		for (const path of INDEXED_PATHS) {
			expect(xml).toContain(`<loc>${localizedUrl(path, 'en')}</loc>`)
			expect(xml).toContain(`<loc>${localizedUrl(path, 'id')}</loc>`)
		}
		expect(xml).not.toContain('/session')
	})

	test('robots.txt allows crawling and points at the sitemap', async () => {
		const response = await fetch(`${ORIGIN}/robots.txt`)
		const text = await response.text()

		expect(text).toContain('Allow: /')
		expect(text).toContain('Sitemap: https://kapturae.r3p.dev/sitemap.xml')
	})
})

describe('javascript budget', () => {
	test(`home page loads at most ${BUDGET_KB} KB of gzipped JavaScript`, async () => {
		expect(await javascriptKilobytes('/')).toBeLessThanOrEqual(BUDGET_KB)
	})

	test.each(['/legal/privacy', '/session/frame', '/session/done', '/session/shoot', '/session/edit'])(
		'%s stays under its ceiling',
		async (path) => {
			expect(await javascriptKilobytes(path)).toBeLessThanOrEqual(CEILINGS_KB[path] ?? BUDGET_KB)
		}
	)
})
