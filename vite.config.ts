import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import adapter from 'svelte-adapter-bun'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { paraglideConfig } from './paraglide.config.ts'

export default defineConfig({
	plugins: [
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

			prerender: {
				handleHttpError: 'fail',
				handleMissingId: 'fail'
			}
		}),

		paraglideVitePlugin(paraglideConfig)
	]
})
