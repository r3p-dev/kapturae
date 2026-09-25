import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import adapter from 'svelte-adapter-bun'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { paraglideConfiguration } from './paraglide.config.ts'
import { frames } from './scripts/frames.ts'
import { legalUpdated } from './scripts/legal_updated.ts'

export default defineConfig({
	define: {
		__LEGAL_UPDATED__: JSON.stringify(legalUpdated() ?? null)
	},

	server: {
		host: true,
		allowedHosts: ['kapturae-tes.r3p.dev']
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
				}
			},

			adapter: adapter(),

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
					'form-action': ['self'],
					'frame-ancestors': ['none']
				}
			},

			prerender: {
				handleHttpError: 'fail',
				handleMissingId: 'fail'
			}
		}),

		paraglideVitePlugin(paraglideConfiguration)
	]
})
