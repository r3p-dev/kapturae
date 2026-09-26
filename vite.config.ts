import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import adapter from '@sveltejs/adapter-static'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import pkg from './package.json' with { type: 'json' }
import { paraglideConfiguration } from './paraglide.config.ts'
import { frames } from './scripts/frames.ts'
import { legalUpdated } from './scripts/legal_updated.ts'
import { LEGAL_DOCUMENTS } from './src/lib/site/legal.ts'

type Path = `/${string}`

const PAGES: Path[] = [
	'/',
	'/legal',
	...LEGAL_DOCUMENTS.map((document): Path => `/legal/${document}`),
	'/session/frame',
	'/session/shoot',
	'/session/edit',
	'/session/done'
]

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		__LEGAL_UPDATED__: JSON.stringify(legalUpdated() ?? null)
	},

	plugins: [
		frames(),
		tailwindcss(),

		sveltekit({
			compilerOptions: {
				runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
			},

			typescript: {
				config: (tsconfig) => {
					tsconfig.include.push('../eslint.config.ts')
					tsconfig.include.push('../playwright.config.ts')
				}
			},

			adapter: adapter({ fallback: '404.html', precompress: true, strict: true }),

			version: { pollInterval: 5 * 60 * 1000 },

			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:', 'blob:'],
					'media-src': ['self', 'blob:'],
					'font-src': ['self'],
					'connect-src': ['self'],
					'worker-src': ['self'],
					'manifest-src': ['self'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['self']
				}
			},

			prerender: {
				entries: [...PAGES, ...PAGES.map((path): Path => (path === '/' ? '/id' : `/id${path}`)), '/sitemap.xml'],
				handleHttpError: 'fail',
				handleMissingId: 'fail'
			}
		}),

		paraglideVitePlugin(paraglideConfiguration)
	]
})
