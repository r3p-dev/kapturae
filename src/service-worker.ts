/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />
import { build, files, prerendered, version } from '$service-worker'

const worker = self as unknown as ServiceWorkerGlobalScope

// `version` changes with every build, so each deploy gets a cache of its own and the previous one is deleted on
// activate. Nothing from an older build is ever served once a new worker takes over.
const CACHE = `kapturae-${version}`
const SKIPPED = /\.woff$|-(cyrillic|cyrillic-ext|greek|vietnamese)-|\/og-|\.(br|gz)$/

const ASSETS = new Set([...build, ...files].filter((path) => !SKIPPED.test(path)))
const PAGES = new Set(prerendered)

worker.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll([...ASSETS, ...PAGES]))
			.then(() => worker.skipWaiting())
	)
})

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
			.then(() => worker.clients.claim())
	)
})

async function networkFirst(request: Request, fallback: string) {
	const cache = await caches.open(CACHE)
	try {
		const response = await fetch(request)
		if (response.ok) {
			cache.put(request, response.clone())
		}
		return response
	} catch (error) {
		const cached = (await cache.match(request)) ?? (await cache.match(fallback))
		if (cached) {
			return cached
		}
		throw error
	}
}

async function cacheFirst(request: Request, path: string) {
	const cache = await caches.open(CACHE)
	const cached = await cache.match(path)
	return cached ?? fetch(request)
}

worker.addEventListener('fetch', (event) => {
	const { request } = event
	const url = new URL(request.url)

	if (request.method !== 'GET' || url.origin !== worker.location.origin) {
		return
	}

	if (ASSETS.has(url.pathname)) {
		event.respondWith(cacheFirst(request, url.pathname))
		return
	}

	event.respondWith(networkFirst(request, url.pathname))
})
