export const LEGAL_DOCUMENTS = ['privacy', 'terms', 'deletion', 'camera', 'data', 'contact'] as const

export type LegalDocument = (typeof LEGAL_DOCUMENTS)[number]
