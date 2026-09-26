import { LEGAL_DOCUMENTS, type LegalDocument } from '$lib/site/legal'

export function match(param: string): param is LegalDocument {
	return (LEGAL_DOCUMENTS as readonly string[]).includes(param)
}
