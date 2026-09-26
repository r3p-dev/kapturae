import { LEGAL_DOCUMENTS } from '$lib/site/legal'
import { baseLocale, locales, localizeUrl, type Locale } from '$lib/paraglide/runtime'

export const SITE = {
	origin: 'https://kapturae.r3p.dev',
	name: 'Kapturae',
	alternateNames: ['Kapturae Photobooth', 'Kapturae Photo Booth'],
	author: { name: 'Muhamad Repiyan Riski', url: 'https://r3p.dev', profiles: ['https://github.com/r3p-dev'] }
} as const

export const INDEXED_PATHS = ['/', ...LEGAL_DOCUMENTS.map((document) => `/legal/${document}`)]

export function absoluteUrl(path: string) {
	return new URL(path, SITE.origin).href
}

export function localizedUrl(path: string, locale: Locale) {
	const url = localizeUrl(new URL(path, SITE.origin), { locale })
	if (url.pathname.length > 1) {
		url.pathname = url.pathname.replace(/\/+$/, '')
	}

	return url.href
}

export function alternates(path: string) {
	return [
		...locales.map((locale) => ({ hreflang: locale, href: localizedUrl(path, locale) })),
		{ hreflang: 'x-default', href: localizedUrl(path, baseLocale) }
	]
}

export function structuredData(locale: Locale, description: string) {
	const home = localizedUrl('/', locale)
	const author = { '@id': absoluteUrl('/#author') }

	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': absoluteUrl('/#website'),
				url: absoluteUrl('/'),
				name: SITE.name,
				alternateName: SITE.alternateNames,
				inLanguage: [...locales],
				publisher: author
			},
			{
				'@type': 'WebApplication',
				'@id': absoluteUrl('/#app'),
				name: SITE.name,
				url: home,
				description,
				inLanguage: locale,
				applicationCategory: 'PhotographyApplication',
				operatingSystem: 'Any',
				browserRequirements: 'A modern web browser and a camera',
				isAccessibleForFree: true,
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
				image: absoluteUrl(`/og/${locale}.png`),
				author
			},
			{
				'@type': 'Person',
				'@id': absoluteUrl('/#author'),
				name: SITE.author.name,
				url: SITE.author.url,
				sameAs: SITE.author.profiles
			}
		]
	}
}

export function jsonLdScript(data: unknown) {
	const json = JSON.stringify(data).replace(/</g, '\\u003c')
	return `<script type="application/ld+json">${json}</script>`
}
