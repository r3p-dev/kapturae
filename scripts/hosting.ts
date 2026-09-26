export const HEADERS = {
	'Content-Security-Policy': "frame-ancestors 'none'",
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()',
	'Strict-Transport-Security': 'max-age=31536000'
} as const

export const IMMUTABLE_PATH = '/_app/immutable/'

export function cacheControl(pathname: string) {
	return pathname.startsWith(IMMUTABLE_PATH) ? 'public, max-age=31536000, immutable' : 'no-cache'
}

export const CONTENT_TYPES: Record<string, string> = {
	'.webmanifest': 'application/manifest+json',
	'.xml': 'application/xml'
}

export const METHODS = ['GET', 'HEAD'] as const

export function candidates(pathname: string) {
	return [pathname, `${pathname}.html`, `${pathname}/index.html`]
}

export const NOT_FOUND = '/404.html'
