import { describe, expect, test } from 'bun:test'
import { INDEXED_PATHS, alternates, jsonLdScript, localizedUrl, structuredData } from '$lib/seo'

describe('localizedUrl', () => {
	test('uses the production origin and no trailing slash', () => {
		expect(localizedUrl('/', 'en')).toBe('https://kapturae.r3p.dev/')
		expect(localizedUrl('/', 'id')).toBe('https://kapturae.r3p.dev/id')
		expect(localizedUrl('/legal/privacy', 'id')).toBe('https://kapturae.r3p.dev/id/legal/privacy')
	})
})

describe('alternates', () => {
	test('lists every language and x-default', () => {
		expect(alternates('/legal/terms')).toEqual([
			{ hreflang: 'en', href: 'https://kapturae.r3p.dev/legal/terms' },
			{ hreflang: 'id', href: 'https://kapturae.r3p.dev/id/legal/terms' },
			{ hreflang: 'x-default', href: 'https://kapturae.r3p.dev/legal/terms' }
		])
	})
})

describe('structuredData', () => {
	const data = structuredData('en', 'A photo booth')
	const types = data['@graph'].map((node) => node['@type'])

	test('names the site Kapturae', () => {
		expect(data['@graph'][0]).toMatchObject({ '@type': 'WebSite', name: 'Kapturae', url: 'https://kapturae.r3p.dev/' })
	})

	test('describes a free web app and has no breadcrumbs', () => {
		expect(types).toEqual(['WebSite', 'WebApplication', 'Person'])
		expect(JSON.stringify(data)).not.toContain('Breadcrumb')
	})

	test('escapes markup inside the script tag', () => {
		expect(jsonLdScript({ text: '</script><script>' })).not.toContain('</script><script>')
	})
})

test('indexes the home page and every legal document, but no session step', () => {
	expect(INDEXED_PATHS).toContain('/')
	expect(INDEXED_PATHS).toContain('/legal/privacy')
	expect(INDEXED_PATHS.some((path) => path.startsWith('/session'))).toBe(false)
})
