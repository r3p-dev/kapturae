declare global {
	namespace App {
		interface Error {
			message: string
			id?: string
		}
	}
}

export {}
