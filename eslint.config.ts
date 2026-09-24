import prettier from 'eslint-config-prettier'
import path from 'node:path'
import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import { defineConfig, includeIgnoreFile } from 'eslint/config'
import globals from 'globals'
import ts from 'typescript-eslint'

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore')

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,

	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			'no-undef': 'off',
			'no-empty': ['error', { allowEmptyCatch: true }]
		}
	},

	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},

	{
		rules: {
			'svelte/no-navigation-without-resolve': ['error', { ignoreLinks: true }]
		}
	},

	{
		ignores: ['src/lib/components/ui/**'],
		rules: {
			curly: ['error', 'all'],
			'func-style': ['error', 'declaration', { allowTypeAnnotation: true }],
			eqeqeq: ['error', 'always'],
			'one-var': ['error', 'never'],
			'no-inner-declarations': ['error', 'both'],
			'no-undef-init': 'error',
			'no-eval': 'error',
			'no-proto': 'error',
			'no-new-wrappers': 'error',
			'no-array-constructor': 'error',
			'no-restricted-globals': [
				'error',
				{ name: 'parseInt', message: 'Use Number.parseInt.' },
				{ name: 'parseFloat', message: 'Use Number.parseFloat.' },
				{ name: 'isNaN', message: 'Use Number.isNaN.' }
			],
			'no-restricted-syntax': [
				'error',
				{ selector: "CallExpression[callee.property.name='forEach']", message: 'Use for...of.' },
				{ selector: 'ForStatement', message: 'Use for...of.' },
				{ selector: 'TSEnumDeclaration', message: 'Use an as const object and a derived union type.' },
				{ selector: 'MethodDefinition[kind=/^(get|set)$/]', message: 'Use a method instead of a getter or setter.' },
				{ selector: 'Property[kind=/^(get|set)$/]', message: 'Use a method instead of a getter or setter.' },
				{ selector: '[accessibility=/^(private|public)$/]', message: 'Use #private members, or no modifier.' },
				{ selector: 'MemberExpression[object.type="AwaitExpression"]', message: 'Assign the awaited value first.' }
			],
			'id-length': ['error', { min: 2, exceptions: ['x', 'y', 'm', '_'], properties: 'never' }],
			'id-denylist': ['error', 'err', 'req', 'res', 'msg', 'btn', 'cfg', 'ctx', 'evt', 'el', 'idx', 'opts', 'args'],
			'@typescript-eslint/no-shadow': 'error',
			'@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }]
		}
	}
)
