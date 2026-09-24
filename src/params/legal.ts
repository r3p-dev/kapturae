import type { ParamMatcher } from '@sveltejs/kit'
import { LEGAL_DOCS, type LegalDoc } from '$lib/legal'

export const match = ((param: string): param is LegalDoc =>
	(LEGAL_DOCS as readonly string[]).includes(param)) satisfies ParamMatcher
