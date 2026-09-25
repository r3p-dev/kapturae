import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

export default defineConfig({
	testDir: 'tests/e2e',
	testMatch: '*.e2e.ts',
	timeout: 120_000,
	forbidOnly: Boolean(process.env.CI),
	reporter: process.env.CI ? 'github' : 'list',

	use: {
		...devices['Desktop Chrome'],
		baseURL: `http://127.0.0.1:${PORT}`,
		viewport: { width: 1440, height: 900 },
		permissions: ['camera'],
		acceptDownloads: true,
		launchOptions: {
			// eslint-disable-next-line id-denylist -- Playwright's option name
			args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
		}
	},

	webServer: {
		command: 'bun scripts/serve_build.ts',
		url: `http://127.0.0.1:${PORT}/`,
		env: { PORT: String(PORT) },
		reuseExistingServer: !process.env.CI,
		timeout: 30_000
	}
})
