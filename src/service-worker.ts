/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker'

const worker = self as unknown as ServiceWorkerGlobalScope
const CACHE = `kapturae-${version}`
const SKIPPED = /\.woff$|-(cyrillic|cyrillic-ext|greek|vietnamese)-|^\/og-|\.(br|gz)$/

const PRECACHE = [...build, ...files].filter((path) => !SKIPPED.test(path))
const PRECACHED = new Set(PRECACHE)

worker.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(PRECACHE))
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

async function fromNetwork(request: Request) {
	const cache = await caches.open(CACHE)
	try {
		const response = await fetch(request)
		if (response.ok) {
			cache.put(request, response.clone())
		}
		return response
	} catch (error) {
		const cached = await cache.match(request)
		if (cached) {
			return cached
		}
		throw error
	}
}

worker.addEventListener('fetch', (event) => {
	const { request } = event
	const url = new URL(request.url)

	if (request.method !== 'GET' || url.origin !== worker.location.origin) {
		return
	}

	if (PRECACHED.has(url.pathname)) {
		event.respondWith(caches.match(url.pathname).then((cached) => cached ?? fetch(request)))
		return
	}

	event.respondWith(fromNetwork(request))
})
