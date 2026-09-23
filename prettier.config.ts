import type { Config } from 'prettier'

const config: Config & { tailwindStylesheet?: string } = {
	useTabs: true,
	tabWidth: 2,
	semi: false,
	singleQuote: true,
	trailingComma: 'none',
	printWidth: 120,
	plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
	overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
	tailwindStylesheet: './src/routes/layout.css'
}

export default config
