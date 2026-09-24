declare global {
	const __LEGAL_UPDATED__: string | null

	namespace App {
		interface Error {
			message: string
			id?: string
		}
	}
}

export {}
