export type UploadResult = { id: string; url: string; qr: string; expiresAt: number }

export type UploadFailure = 'network' | 'timeout' | 'too_large' | 'server'

export class UploadError extends Error {
	constructor(
		readonly reason: UploadFailure,
		readonly status?: number
	) {
		super(status ? `${reason} (${status})` : reason)
	}
}

export const MAX_ATTEMPTS = 3

const TIMEOUT_MS = 90_000
const RETRY_DELAY_MS = 1500

const retryable = (status: number) => status >= 500 || status === 408 || status === 429

export async function uploadShare(form: FormData, onAttempt?: (attempt: number) => void) {
	let failure = new UploadError('network')

	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		onAttempt?.(attempt)

		try {
			const response = await fetch('/api/share', {
				method: 'POST',
				body: form,
				signal: AbortSignal.timeout(TIMEOUT_MS)
			})

			if (response.ok) return (await response.json()) as UploadResult

			failure = new UploadError(response.status === 413 ? 'too_large' : 'server', response.status)
			if (!retryable(response.status)) throw failure
		} catch (error) {
			if (error instanceof UploadError) throw error
			failure = new UploadError(error instanceof DOMException && error.name === 'TimeoutError' ? 'timeout' : 'network')
		}

		if (attempt < MAX_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt))
	}

	throw failure
}
