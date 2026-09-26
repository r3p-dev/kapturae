const registry = new Map<string, { id: string; blob: Blob }>()

export function objectUrl(blob: Blob, id: string = crypto.randomUUID()) {
	const url = URL.createObjectURL(blob)
	registry.set(url, { id, blob })
	return url
}

export function blobEntry(url: string) {
	return registry.get(url)
}

export function revoke(url: string) {
	if (url.startsWith('blob:')) {
		URL.revokeObjectURL(url)
		registry.delete(url)
	}
}
