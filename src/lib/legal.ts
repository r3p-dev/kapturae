export const LEGAL_DOCS = ['privacy', 'terms', 'deletion', 'camera', 'data', 'contact'] as const

export type LegalDoc = (typeof LEGAL_DOCS)[number]
