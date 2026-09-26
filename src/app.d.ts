declare global {
	const __APP_VERSION__: string
	const __LEGAL_UPDATED__: string | null

	namespace App {
		interface Error {
			message: string
			id?: string
		}
	}
}

export {}
