import { locales } from '$lib/paraglide/runtime'
import { INDEXED_PATHS, alternates, localizedUrl } from '$lib/seo'
import type { RequestHandler } from './$types'

export const prerender = true

function entry(path: string, url: string) {
	const lastModified =
		path.startsWith('/legal/') && __LEGAL_UPDATED__ ? `\n\t\t<lastmod>${__LEGAL_UPDATED__}</lastmod>` : ''
	const links = alternates(path)
		.map(({ hreflang, href }) => `\n\t\t<xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}"/>`)
		.join('')

	return `\t<url>\n\t\t<loc>${url}</loc>${lastModified}${links}\n\t</url>`
}

export const GET: RequestHandler = function () {
	const urls = INDEXED_PATHS.flatMap((path) => locales.map((locale) => entry(path, localizedUrl(path, locale))))
	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		...urls,
		'</urlset>',
		''
	].join('\n')

	return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
