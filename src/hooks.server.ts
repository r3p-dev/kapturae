import type { Handle, HandleServerError } from '@sveltejs/kit'
import { getTextDirection } from '$lib/paraglide/runtime'
import { paraglideMiddleware } from '$lib/paraglide/server'

const NOT_INDEXED = /^\/(id\/)?session\/|^\/\[fallback\]$/

const handleParaglide: Handle = function ({ event, resolve }) {
	const isIndexed = !NOT_INDEXED.test(event.url.pathname)

	return paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request

		return resolve(event, {
			transformPageChunk: ({ html }) => {
				const page = html.replace('%paraglide.lang%', locale).replace('%paraglide.dir%', getTextDirection(locale))
				return isIndexed ? page : page.replace('</head>', '\t<meta name="robots" content="noindex" />\n\t</head>')
			}
		})
	})
}

export const handle: Handle = handleParaglide

export const handleError: HandleServerError = function ({ error, status, message }) {
	if (status === 404) {
		return { message }
	}

	const id = crypto.randomUUID().slice(0, 8)
	console.error(`[${id}]`, error)

	return { message, id }
}
