import type { CompilerOptions } from '@inlang/paraglide-js'

export const paraglideConfiguration: CompilerOptions = {
	project: './project.inlang',
	outdir: './src/lib/paraglide',
	emitTsDeclarations: true,
	strategy: ['url', 'baseLocale'],
	trailingSlash: 'never'
}
